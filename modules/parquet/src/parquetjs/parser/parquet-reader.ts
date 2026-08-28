// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Copyright (c) 2017 ironSource Ltd.
// Forked from https://github.com/kbajalc/parquets under MIT license

import type {ReadableFile} from '@loaders.gl/loader-utils';

import {ParquetSchema} from '../schema/schema';
import {
  decodeSchema,
  decodeDataPages,
  decodePage,
  decodeUncompressedDataPages,
  decodeUncompressedDictionaryBuffer
} from './decoders';
import {materializeRows} from '../schema/shred';
import {createParquetPageDecompressor, type ParquetPageDecompressor} from '../compression';

import {PARQUET_MAGIC, PARQUET_MAGIC_ENCRYPTED} from '../../lib/constants';
import {
  ColumnChunk,
  CompressionCodec,
  Encoding,
  FileMetaData,
  PageType,
  RowGroup,
  Type
} from '../parquet-thrift/index';
import {
  ParquetRowGroup,
  ParquetCompression,
  ParquetColumnChunk,
  PrimitiveType,
  ParquetReaderContext,
  type ParquetLevelBuffer
} from '../schema/declare';
import {
  decodeColumnMetadata,
  decodeFileCryptoMetadata,
  decodeFileMetadata,
  decodePageHeader,
  getThriftEnum,
  fieldIndexOf,
  serializeThrift
} from '../utils/read-utils';
import {decodeString, readUInt32LE, toUint8Array} from '../utils/binary-utils';
import {CompactInt64} from '../utils/uint8-array-compact-protocol';
import type {
  ParquetDataPageLocation,
  ParquetPageLocations,
  ParquetRowRange
} from '../../lib/parquet-page-index';
import {
  createParquetModuleAad,
  decryptParquetModule,
  readParquetEncryptedModule,
  verifyParquetFooterSignature,
  type ParquetEncryptionAlgorithm,
  type ParquetKeyRetriever
} from '../../lib/parquet-encryption';
import type {ParquetEncryptionModule} from '../../lib/parquet-encryption';

/** Bounds concurrent range requests when a row group contains unusually many selected columns. */
const MAXIMUM_CONCURRENT_COLUMN_READS = 16;

/**
 * Returns whether column metadata guarantees that every data page can decode directly into an
 * Arrow-compatible byte buffer. Level encodings are included in the metadata encoding set and do
 * not prevent the byte-array fast path.
 */
function hasOnlyArrowByteArrayDataPageEncodings(
  encodings: Encoding[],
  dictionaryPageOffset: number | undefined
): boolean {
  if (dictionaryPageOffset !== undefined || encodings.length === 0) {
    return false;
  }
  for (const encoding of encodings) {
    if (
      encoding !== Encoding.PLAIN &&
      encoding !== Encoding.DELTA_LENGTH_BYTE_ARRAY &&
      encoding !== Encoding.DELTA_BYTE_ARRAY &&
      encoding !== Encoding.RLE &&
      encoding !== Encoding.BIT_PACKED
    ) {
      return false;
    }
  }
  return true;
}

/** Returns the algorithm name represented by the Thrift encryption union. */
function getEncryptionAlgorithm(value: {
  AES_GCM_V1?: unknown;
  AES_GCM_CTR_V1?: unknown;
}): ParquetEncryptionAlgorithm {
  if (value.AES_GCM_V1) return 'AES_GCM_V1';
  if (value.AES_GCM_CTR_V1) return 'AES_GCM_CTR_V1';
  throw new Error('Unsupported Parquet encryption algorithm');
}

export type ParquetReaderProps = {
  /** Maximum dictionary-page read size. */
  defaultDictionarySize?: number;
  /** Preserve BYTE_ARRAY values instead of decoding them as strings. */
  preserveBinary?: boolean;
  /** Retain byte arrays as views into decoded page buffers for direct materialization. */
  retainByteArrayViews?: boolean;
  /** Decode supported primitive columns into typed buffers instead of boxed JavaScript arrays. */
  useTypedValueBuffers?: boolean;
  /** Decode repetition and definition levels into compact unsigned typed arrays. */
  useTypedLevelBuffers?: boolean;
  /** Decode eligible PLAIN BYTE_ARRAY columns into Arrow-compatible contiguous buffers. */
  useArrowByteArrayBuffers?: boolean;
  /** Verify page-header CRC values when present. Disabled by default for throughput. */
  verifyPageChecksums?: boolean;
  /** Decode legacy INT96 values as epoch nanoseconds for Arrow timestamp columns. */
  int96AsTimestamp?: boolean;
  /** Verify plaintext-footer signatures when present. Enabled by default. */
  verifyFooterSignature?: boolean;
  /** Abort signal forwarded to every underlying random-access read. */
  signal?: AbortSignal;
  /** Resolves modular-encryption keys from the file's key metadata. */
  keyRetriever?: ParquetKeyRetriever;
  /** AAD prefix for files that intentionally omit it from FileCryptoMetaData. */
  aadPrefix?: Uint8Array;
  /** Pre-resolved encryption context used by worker-local readers. */
  encryptionContext?: ParquetReaderEncryptionContext;
};

/** Properties for initializing a ParquetRowGroupReader */
export type ParquetIterationProps = {
  /** Filter allowing some columns to be dropped */
  columnList?: string[] | string[][];
  /** Zero-based row-group indexes to read, in output order. */
  rowGroups?: number[];
  /** Abort signal forwarded to row-group and column-chunk reads. */
  signal?: AbortSignal;
};

type NormalizedParquetReaderProps = Required<
  Omit<ParquetReaderProps, 'signal' | 'keyRetriever' | 'aadPrefix' | 'encryptionContext'>
> &
  Pick<ParquetReaderProps, 'signal' | 'keyRetriever' | 'aadPrefix' | 'encryptionContext'>;

/** File-level parameters needed to authenticate modular-encrypted modules. */
type ParquetEncryptionContext = {
  algorithm: ParquetEncryptionAlgorithm;
  aadPrefix?: Uint8Array;
  fileUnique: Uint8Array;
  footerKeyMetadata?: Uint8Array;
  footerSigningKeyMetadata?: Uint8Array;
};

/** File-level encryption parameters needed to decrypt worker-transferred page modules. */
export type ParquetReaderEncryptionContext = Pick<
  ParquetEncryptionContext,
  'algorithm' | 'aadPrefix' | 'fileUnique' | 'footerKeyMetadata'
>;

/**
 * The parquet envelope reader allows direct, unbuffered access to the individual
 * sections of the parquet file, namely the header, footer and the row groups.
 * This class is intended for advanced/internal users; if you just want to retrieve
 * rows from a parquet file use the ParquetReader instead
 */
export class ParquetReader {
  static defaultProps: NormalizedParquetReaderProps = {
    // max ArrayBuffer size in js is 2Gb
    defaultDictionarySize: 2147483648,
    preserveBinary: false,
    retainByteArrayViews: false,
    useTypedValueBuffers: false,
    useTypedLevelBuffers: false,
    useArrowByteArrayBuffers: false,
    verifyPageChecksums: false,
    int96AsTimestamp: false,
    verifyFooterSignature: true,
    signal: undefined,
    keyRetriever: undefined,
    aadPrefix: undefined,
    encryptionContext: undefined
  };

  props: NormalizedParquetReaderProps;
  file: ReadableFile;
  metadata: Promise<FileMetaData> | null = null;
  /** Parsed Parquet schema shared by metadata, iteration, and materialization paths. */
  private schema: Promise<ParquetSchema> | null = null;
  /** Encryption parameters decoded from plaintext or encrypted footer metadata. */
  private encryptionContext?: ParquetEncryptionContext;
  /** Resolved keys shared by encrypted modules in this reader instance. */
  private readonly encryptionKeyCache = new Map<string, Promise<ArrayBuffer | ArrayBufferView>>();
  /** Compression backends selected once and shared by every page in this reader. */
  private readonly pageDecompressors = new Map<ParquetCompression, ParquetPageDecompressor>();

  constructor(file: ReadableFile, props?: ParquetReaderProps) {
    this.file = file;
    this.props = {...ParquetReader.defaultProps, ...props};
    this.encryptionContext = this.props.encryptionContext;
  }

  /** Whether the decoded footer describes an encrypted Parquet file. */
  get encrypted(): boolean {
    return Boolean(this.encryptionContext);
  }

  /** Whether this reader decodes legacy INT96 values as epoch nanoseconds. */
  get int96AsTimestamp(): boolean {
    return this.props.int96AsTimestamp;
  }

  /** Returns a cloneable snapshot of the file encryption context for worker decoding. */
  getEncryptionContextForWorker(): ParquetReaderEncryptionContext | undefined {
    const encryptionContext = this.encryptionContext;
    if (!encryptionContext) return undefined;
    return {
      algorithm: encryptionContext.algorithm,
      aadPrefix: encryptionContext.aadPrefix && new Uint8Array(encryptionContext.aadPrefix),
      fileUnique: new Uint8Array(encryptionContext.fileUnique),
      footerKeyMetadata:
        encryptionContext.footerKeyMetadata && new Uint8Array(encryptionContext.footerKeyMetadata)
    };
  }

  /** Resolves one column key on the caller thread before transferring encrypted ranges. */
  async getColumnKeyForWorker(
    columnChunk: ColumnChunk,
    rowGroupOrdinal: number,
    columnOrdinal: number
  ): Promise<{keyMetadata?: Uint8Array; keyMaterial: Uint8Array}> {
    if (!this.encryptionContext || !this.props.keyRetriever) {
      throw new Error('Encrypted Parquet worker reads require parquet.keyRetriever');
    }
    const keyMetadata = this.getColumnKeyMetadata(columnChunk);
    const keyMaterial = await this.props.keyRetriever(keyMetadata, {
      algorithm: this.encryptionContext.algorithm,
      aad: createParquetModuleAad(
        this.encryptionContext.aadPrefix,
        this.encryptionContext.fileUnique,
        'data-page',
        rowGroupOrdinal,
        columnOrdinal,
        0
      )
    });
    const keyBytes =
      keyMaterial instanceof ArrayBuffer
        ? new Uint8Array(keyMaterial)
        : new Uint8Array(keyMaterial.buffer, keyMaterial.byteOffset, keyMaterial.byteLength);
    return {keyMetadata, keyMaterial: keyBytes};
  }

  close(): void {
    this.encryptionKeyCache.clear();
    this.pageDecompressors.clear();
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.file.close();
  }

  /** Returns the reader-scoped decoder for one Parquet compression method. */
  private getPageDecompressor(compression: ParquetCompression): ParquetPageDecompressor {
    let decompressor = this.pageDecompressors.get(compression);
    if (!decompressor) {
      decompressor = createParquetPageDecompressor(compression);
      this.pageDecompressors.set(compression, decompressor);
    }
    return decompressor;
  }

  /** Reads a byte range, retaining a zero-copy view when the complete file is already in memory. */
  private async readBytes(
    start: number,
    length: number,
    signal?: AbortSignal
  ): Promise<Uint8Array> {
    const effectiveSignal = signal ?? this.props.signal;
    if (effectiveSignal?.aborted) {
      throw new Error('Request aborted');
    }
    if (this.file.handle instanceof ArrayBuffer) {
      return new Uint8Array(this.file.handle, start, length);
    }
    return toUint8Array(await this.file.read(start, length, effectiveSignal));
  }

  /** Returns a reader-scoped key resolver that avoids repeating key-provider work per module. */
  private getCachedKeyRetriever(): ParquetKeyRetriever {
    const keyRetriever = this.props.keyRetriever;
    if (!keyRetriever) {
      throw new Error('Encrypted Parquet requires parquet.keyRetriever');
    }
    return (keyMetadata, context) => {
      const encryptionContext = this.encryptionContext;
      const cacheKey = createEncryptionKeyCacheKey(
        context.algorithm,
        keyMetadata,
        context.aad,
        encryptionContext?.aadPrefix?.byteLength ?? this.props.aadPrefix?.byteLength,
        encryptionContext?.fileUnique.byteLength
      );
      let keyPromise = this.encryptionKeyCache.get(cacheKey);
      if (!keyPromise) {
        keyPromise = Promise.resolve().then(() => keyRetriever(keyMetadata, context));
        this.encryptionKeyCache.set(cacheKey, keyPromise);
        void keyPromise.catch(() => {
          if (this.encryptionKeyCache.get(cacheKey) === keyPromise) {
            this.encryptionKeyCache.delete(cacheKey);
          }
        });
      }
      return keyPromise;
    };
  }

  // HIGH LEVEL METHODS

  /** Yield one row at a time */
  async *rowIterator(props?: ParquetIterationProps) {
    for await (const rows of this.rowBatchIterator(props)) {
      // yield *rows
      for (const row of rows) {
        yield row;
      }
    }
  }

  /** Yield one batch of rows at a time */
  async *rowBatchIterator(props?: ParquetIterationProps) {
    const schema = await this.getSchema();
    for await (const rowGroup of this.rowGroupIterator(props)) {
      yield materializeRows(schema, rowGroup);
    }
  }

  /** Iterate over the raw row groups */
  async *rowGroupIterator(props?: ParquetIterationProps) {
    // Ensure strings are nested in arrays
    const columnList: string[][] = (props?.columnList || []).map(x => (Array.isArray(x) ? x : [x]));

    const metadata = await this.getFileMetadata(props?.signal);
    const schema = await this.getSchema(props?.signal);

    const rowGroupCount = metadata?.row_groups.length || 0;
    const rowGroupIndices =
      props?.rowGroups || Array.from({length: rowGroupCount}, (_, index) => index);

    for (const rowGroupIndex of rowGroupIndices) {
      if (!Number.isInteger(rowGroupIndex) || rowGroupIndex < 0 || rowGroupIndex >= rowGroupCount) {
        throw new Error(`Invalid Parquet row-group index ${rowGroupIndex}`);
      }
      const rowGroup = await this.readRowGroup(
        schema,
        metadata.row_groups[rowGroupIndex],
        columnList,
        props?.signal,
        rowGroupIndex
      );
      yield rowGroup;
    }
  }

  async getRowCount(signal?: AbortSignal): Promise<number> {
    const metadata = await this.getFileMetadata(signal);
    return Number(metadata.num_rows);
  }

  async getSchema(signal?: AbortSignal): Promise<ParquetSchema> {
    this.schema ||= this.getFileMetadata(signal).then(metadata => {
      const root = metadata.schema[0];
      const {schema: schemaDefinition} = decodeSchema(metadata.schema, 1, root.num_children!);
      return new ParquetSchema(schemaDefinition);
    });
    return await this.schema;
  }

  /**
   * Returns the user (key/value) metadata for this file
   * In parquet this is not stored on the schema like it is in arrow
   */
  async getSchemaMetadata(): Promise<Record<string, string>> {
    const metadata = await this.getFileMetadata();
    const md: Record<string, string> = {};
    for (const kv of metadata.key_value_metadata!) {
      md[kv.key] = kv.value!;
    }
    return md;
  }

  async getFileMetadata(signal?: AbortSignal): Promise<FileMetaData> {
    if (!this.metadata) {
      await this.readHeader(signal);
      this.metadata = this.readFooter(signal);
    }
    return this.metadata;
  }

  // LOW LEVEL METHODS

  /** Metadata is stored in the footer */
  async readHeader(signal?: AbortSignal): Promise<void> {
    const magic = decodeString(await this.readBytes(0, PARQUET_MAGIC.length, signal));
    switch (magic) {
      case PARQUET_MAGIC:
        break;
      case PARQUET_MAGIC_ENCRYPTED:
        break;
      default:
        throw new Error(`Invalid parquet file (magic=${magic})`);
    }
  }

  /** Metadata is stored in the footer */
  async readFooter(signal?: AbortSignal): Promise<FileMetaData> {
    const trailerLen = PARQUET_MAGIC.length + 4;
    const trailer = await this.readBytes(this.file.size - trailerLen, trailerLen, signal);

    const magic = decodeString(trailer, 4);
    const metadataSize = readUInt32LE(trailer, 0);
    const metadataOffset = this.file.size - metadataSize - trailerLen;
    if (magic === PARQUET_MAGIC_ENCRYPTED) {
      return await this.readEncryptedFooter(metadataSize, metadataOffset, signal);
    }
    if (magic !== PARQUET_MAGIC) {
      throw new Error(`Not a valid parquet file (magic="${magic})`);
    }

    if (metadataOffset < PARQUET_MAGIC.length) {
      throw new Error(`Invalid metadata size ${metadataOffset}`);
    }

    const metadataBuf = await this.readBytes(metadataOffset, metadataSize, signal);
    // let metadata = new parquet_thrift.FileMetaData();
    // parquet_util.decodeThrift(metadata, metadataBuf);

    const decoded = decodeFileMetadata(metadataBuf);
    const {metadata} = decoded;
    this.setEncryptionContext(metadata);
    if (this.props.verifyFooterSignature && this.encryptionContext?.footerSigningKeyMetadata) {
      // The compact-protocol decoder may consume bytes from the signature that
      // happen to look like valid Thrift fields. The format defines the
      // signature as the final fixed 28 bytes of the footer range, so use the
      // physical boundary rather than the decoder's consumed length.
      const signatureOffset = metadataBuf.byteLength - 28;
      if (signatureOffset < decoded.length) {
        throw new Error('Invalid Parquet plaintext-footer signature boundary');
      }
      const signature = metadataBuf.subarray(signatureOffset);
      const encryptionContext = this.encryptionContext;
      if (!this.props.keyRetriever) {
        throw new Error('Signed Parquet footer requires parquet.keyRetriever');
      }
      await verifyParquetFooterSignature(metadataBuf.subarray(0, signatureOffset), signature, {
        algorithm: encryptionContext.algorithm,
        aad: createParquetModuleAad(
          encryptionContext.aadPrefix,
          encryptionContext.fileUnique,
          'footer'
        ),
        keyMetadata: encryptionContext.footerSigningKeyMetadata,
        keyRetriever: this.getCachedKeyRetriever()
      });
    }
    return metadata;
  }

  /** Reads and decrypts an encrypted footer after the standard trailer. */
  private async readEncryptedFooter(
    metadataSize: number,
    metadataOffset: number,
    signal?: AbortSignal
  ): Promise<FileMetaData> {
    if (!this.props.keyRetriever) {
      throw new Error('Encrypted Parquet footer requires parquet.keyRetriever');
    }
    const encryptedFooter = await this.readBytes(metadataOffset, metadataSize, signal);
    const cryptoMetadata = decodeFileCryptoMetadata(encryptedFooter);
    const algorithm = getEncryptionAlgorithm(cryptoMetadata.metadata.encryption_algorithm);
    const algorithmMetadata =
      cryptoMetadata.metadata.encryption_algorithm.AES_GCM_V1 ||
      cryptoMetadata.metadata.encryption_algorithm.AES_GCM_CTR_V1;
    const aadPrefix = algorithmMetadata?.aad_prefix || this.props.aadPrefix;
    if (!algorithmMetadata?.aad_file_unique) {
      throw new Error('Encrypted Parquet footer is missing aad_file_unique');
    }
    const aad = createParquetModuleAad(aadPrefix, algorithmMetadata.aad_file_unique, 'footer');
    const plaintext = await decryptParquetModule(encryptedFooter.subarray(cryptoMetadata.length), {
      algorithm,
      aad,
      keyMetadata: cryptoMetadata.metadata.key_metadata,
      keyRetriever: this.getCachedKeyRetriever()
    });
    this.encryptionContext = {
      algorithm,
      aadPrefix,
      fileUnique: algorithmMetadata.aad_file_unique,
      footerKeyMetadata: cryptoMetadata.metadata.key_metadata
    };
    const metadata = decodeFileMetadata(plaintext).metadata;
    return metadata;
  }

  /** Records the encryption parameters exposed by plaintext-footer files. */
  private setEncryptionContext(metadata: FileMetaData): void {
    const encryptionAlgorithm = metadata.encryption_algorithm;
    if (!encryptionAlgorithm) return;
    const algorithm = getEncryptionAlgorithm(encryptionAlgorithm);
    const algorithmMetadata = encryptionAlgorithm.AES_GCM_V1 || encryptionAlgorithm.AES_GCM_CTR_V1;
    if (!algorithmMetadata?.aad_file_unique) {
      throw new Error('Encrypted Parquet footer is missing aad_file_unique');
    }
    this.encryptionContext = {
      algorithm,
      aadPrefix: algorithmMetadata.aad_prefix || this.props.aadPrefix,
      fileUnique: algorithmMetadata.aad_file_unique,
      footerSigningKeyMetadata: metadata.footer_signing_key_metadata
    };
  }

  /** Resolves only the selected encrypted columns, using crypto metadata paths before decryption. */
  async resolveColumnMetadata(
    rowGroup: RowGroup,
    rowGroupOrdinal: number,
    selectedColumnPaths?: readonly string[][]
  ): Promise<void> {
    for (let columnOrdinal = 0; columnOrdinal < rowGroup.columns.length; columnOrdinal++) {
      const columnChunk = rowGroup.columns[columnOrdinal];
      const path = getColumnChunkPath(columnChunk);
      if (
        selectedColumnPaths &&
        path &&
        !selectedColumnPaths.some(
          selectedPath => fieldIndexOf([Array.from(selectedPath)], path) >= 0
        )
      ) {
        continue;
      }
      if (columnChunk.encrypted_column_metadata && !columnChunk.meta_data) {
        columnChunk.meta_data = await this.getColumnMetadata(
          columnChunk,
          rowGroupOrdinal,
          getPhysicalColumnOrdinal(columnChunk, columnOrdinal)
        );
      }
    }
  }

  /** Decrypts one encrypted column index or offset index module for selective planning. */
  async decryptIndexModule(
    bytes: Uint8Array,
    module: 'column-index' | 'offset-index',
    rowGroupOrdinal: number,
    columnOrdinal: number,
    columnChunk: ColumnChunk
  ): Promise<Uint8Array> {
    if (!columnChunk.crypto_metadata) return bytes;
    const encryptionContext = this.encryptionContext;
    if (!encryptionContext || !this.props.keyRetriever) {
      throw new Error('Encrypted Parquet indexes require parquet.keyRetriever');
    }
    const aad = createParquetModuleAad(
      encryptionContext.aadPrefix,
      encryptionContext.fileUnique,
      module,
      rowGroupOrdinal,
      columnOrdinal
    );
    return await decryptParquetModule(bytes, {
      algorithm: encryptionContext.algorithm,
      aad,
      keyMetadata: this.getColumnKeyMetadata(columnChunk),
      keyRetriever: this.getCachedKeyRetriever()
    });
  }

  /** Decrypts the encrypted Bloom-filter header and bitset modules for one column chunk. */
  async decryptBloomFilter(
    bytes: Uint8Array,
    rowGroupOrdinal: number,
    columnOrdinal: number,
    columnChunk: ColumnChunk
  ): Promise<Uint8Array> {
    if (!columnChunk.crypto_metadata) return bytes;
    const encryptionContext = this.encryptionContext;
    if (!encryptionContext || !this.props.keyRetriever) {
      throw new Error('Encrypted Parquet Bloom filters require parquet.keyRetriever');
    }
    const header = readParquetEncryptedModule(bytes);
    const bitset = readParquetEncryptedModule(bytes, header.nextOffset);
    const keyMetadata = this.getColumnKeyMetadata(columnChunk);
    const headerBytes = await decryptParquetModule(header.bytes, {
      algorithm: encryptionContext.algorithm,
      aad: createParquetModuleAad(
        encryptionContext.aadPrefix,
        encryptionContext.fileUnique,
        'bloom-filter-header',
        rowGroupOrdinal,
        columnOrdinal
      ),
      keyMetadata,
      keyRetriever: this.getCachedKeyRetriever()
    });
    const bitsetBytes = await decryptParquetModule(bitset.bytes, {
      algorithm: encryptionContext.algorithm,
      aad: createParquetModuleAad(
        encryptionContext.aadPrefix,
        encryptionContext.fileUnique,
        'bloom-filter-bitset',
        rowGroupOrdinal,
        columnOrdinal
      ),
      keyMetadata,
      keyRetriever: this.getCachedKeyRetriever()
    });
    const plaintext = new Uint8Array(headerBytes.byteLength + bitsetBytes.byteLength);
    plaintext.set(headerBytes);
    plaintext.set(bitsetBytes, headerBytes.byteLength);
    return plaintext;
  }

  /** Resolves a column's plaintext metadata, decrypting column-specific metadata when present. */
  private async getColumnMetadata(
    columnChunk: ColumnChunk,
    rowGroupOrdinal: number,
    columnOrdinal: number
  ): Promise<NonNullable<ColumnChunk['meta_data']>> {
    if (!columnChunk.encrypted_column_metadata) {
      if (!columnChunk.meta_data) {
        throw new Error('Parquet column metadata is missing');
      }
      return columnChunk.meta_data;
    }
    if (!this.props.keyRetriever) {
      throw new Error('Encrypted Parquet column metadata requires parquet.keyRetriever');
    }
    const encryptionContext = this.encryptionContext;
    if (!encryptionContext) {
      throw new Error('Encrypted Parquet column metadata has no file encryption context');
    }
    const columnKey = columnChunk.crypto_metadata?.ENCRYPTION_WITH_COLUMN_KEY;
    const usesFooterKey = Boolean(columnChunk.crypto_metadata?.ENCRYPTION_WITH_FOOTER_KEY);
    if (!columnKey && !usesFooterKey) {
      throw new Error('Encrypted Parquet column metadata has no key reference');
    }
    const aad = createParquetModuleAad(
      encryptionContext.aadPrefix,
      encryptionContext.fileUnique,
      'column-metadata',
      rowGroupOrdinal,
      columnOrdinal
    );
    const plaintext = await decryptParquetModule(columnChunk.encrypted_column_metadata, {
      algorithm: encryptionContext.algorithm,
      aad,
      keyMetadata:
        columnKey?.key_metadata ??
        encryptionContext.footerKeyMetadata ??
        encryptionContext.footerSigningKeyMetadata,
      keyRetriever: this.getCachedKeyRetriever()
    });
    const metadata = decodeColumnMetadata(plaintext).metadata;
    if (
      columnKey &&
      JSON.stringify(metadata.path_in_schema) !== JSON.stringify(columnKey.path_in_schema)
    ) {
      throw new Error('Encrypted Parquet column metadata path does not match crypto metadata');
    }
    return metadata;
  }

  /** Data is stored in row groups (similar to Apache Arrow record batches) */
  async readRowGroup(
    schema: ParquetSchema,
    rowGroup: RowGroup,
    columnList: string[][],
    signal?: AbortSignal,
    rowGroupOrdinal = 0
  ): Promise<ParquetRowGroup> {
    await this.resolveColumnMetadata(rowGroup, rowGroupOrdinal, columnList);
    const selectedColumnChunks: Array<{
      columnChunk: ColumnChunk;
      metadata: NonNullable<ColumnChunk['meta_data']>;
      columnOrdinal: number;
    }> = [];
    for (let columnOrdinal = 0; columnOrdinal < rowGroup.columns.length; columnOrdinal++) {
      const columnChunk = rowGroup.columns[columnOrdinal];
      const path = getColumnChunkPath(columnChunk);
      if (columnList.length > 0 && (!path || fieldIndexOf(columnList, path) < 0)) {
        continue;
      }
      const physicalColumnOrdinal = getPhysicalColumnOrdinal(columnChunk, columnOrdinal);
      const metadata =
        columnChunk.meta_data ||
        (await this.getColumnMetadata(columnChunk, rowGroupOrdinal, physicalColumnOrdinal));
      if (columnList.length === 0 || fieldIndexOf(columnList, metadata.path_in_schema) >= 0) {
        selectedColumnChunks.push({columnChunk, metadata, columnOrdinal: physicalColumnOrdinal});
      }
    }
    if (
      this.file.handle instanceof ArrayBuffer &&
      selectedColumnChunks.every(
        ({columnChunk, metadata}) =>
          (columnChunk.file_path === undefined || columnChunk.file_path === null) &&
          !columnChunk.crypto_metadata &&
          getThriftEnum(CompressionCodec, metadata.codec) === 'UNCOMPRESSED'
      )
    ) {
      return {
        rowCount: Number(rowGroup.num_rows),
        columnData: Object.fromEntries(
          selectedColumnChunks.map(({columnChunk, metadata}) => [
            metadata.path_in_schema.join(),
            this.readUncompressedColumnChunkFromMemory(schema, columnChunk, metadata)
          ])
        )
      };
    }
    const columnEntries: Array<readonly [string, ParquetColumnChunk]> = [];
    for (
      let batchStart = 0;
      batchStart < selectedColumnChunks.length;
      batchStart += MAXIMUM_CONCURRENT_COLUMN_READS
    ) {
      const columnBatch = selectedColumnChunks.slice(
        batchStart,
        batchStart + MAXIMUM_CONCURRENT_COLUMN_READS
      );
      columnEntries.push(
        ...(await Promise.all(
          columnBatch.map(({columnChunk, metadata, columnOrdinal}) => {
            const columnKey = metadata.path_in_schema.join();
            if (
              this.file.handle instanceof ArrayBuffer &&
              (columnChunk.file_path === undefined || columnChunk.file_path === null) &&
              !columnChunk.crypto_metadata &&
              getThriftEnum(CompressionCodec, metadata.codec) === 'UNCOMPRESSED'
            ) {
              return [
                columnKey,
                this.readUncompressedColumnChunkFromMemory(schema, columnChunk, metadata)
              ] as const;
            }
            return this.readColumnChunk(
              schema,
              columnChunk,
              signal,
              rowGroupOrdinal,
              columnOrdinal,
              metadata
            ).then(columnData => [columnKey, columnData] as const);
          })
        ))
      );
    }
    return {
      rowCount: Number(rowGroup.num_rows),
      columnData: Object.fromEntries(columnEntries)
    };
  }

  /** Reads independently materializable non-repeated columns for one row range using page indexes. */
  async readRowGroupRange(
    schema: ParquetSchema,
    rowGroup: RowGroup,
    columnList: string[][],
    rowRange: ParquetRowRange,
    pageLocations: ParquetPageLocations,
    signal?: AbortSignal,
    rowGroupOrdinal = 0
  ): Promise<ParquetRowGroup> {
    await this.resolveColumnMetadata(rowGroup, rowGroupOrdinal, columnList);
    const selectedColumnChunks: Array<{
      columnChunk: ColumnChunk;
      metadata: NonNullable<ColumnChunk['meta_data']>;
      columnOrdinal: number;
    }> = [];
    for (let columnOrdinal = 0; columnOrdinal < rowGroup.columns.length; columnOrdinal++) {
      const columnChunk = rowGroup.columns[columnOrdinal];
      const path = getColumnChunkPath(columnChunk);
      if (columnList.length > 0 && (!path || fieldIndexOf(columnList, path) < 0)) {
        continue;
      }
      const physicalColumnOrdinal = getPhysicalColumnOrdinal(columnChunk, columnOrdinal);
      const metadata =
        columnChunk.meta_data ||
        (await this.getColumnMetadata(columnChunk, rowGroupOrdinal, physicalColumnOrdinal));
      if (columnList.length === 0 || fieldIndexOf(columnList, metadata.path_in_schema) >= 0) {
        selectedColumnChunks.push({columnChunk, metadata, columnOrdinal: physicalColumnOrdinal});
      }
    }
    const columnEntries = await Promise.all(
      selectedColumnChunks.map(async ({columnChunk, metadata, columnOrdinal}) => {
        const columnKey = metadata.path_in_schema.join();
        const pages = pageLocations[JSON.stringify(metadata.path_in_schema)];
        if (!pages) {
          throw new Error(`Parquet offset index missing for ${columnKey}`);
        }
        const columnData = await this.readColumnChunkRange(
          schema,
          columnChunk,
          rowRange,
          pages,
          signal,
          rowGroupOrdinal,
          columnOrdinal,
          metadata
        );
        return [columnKey, columnData] as const;
      })
    );
    return {
      rowCount: rowRange.end - rowRange.start,
      columnData: Object.fromEntries(columnEntries)
    };
  }

  /**
   * Each row group contains column chunks for all the columns.
   */
  private readUncompressedColumnChunkFromMemory(
    schema: ParquetSchema,
    columnChunk: ColumnChunk,
    metadata: NonNullable<ColumnChunk['meta_data']>
  ): ParquetColumnChunk {
    if (!(this.file.handle instanceof ArrayBuffer)) {
      throw new Error('Synchronous Parquet column reads require an in-memory ArrayBuffer');
    }
    const field = schema.findField(metadata.path_in_schema);
    const type: PrimitiveType = getThriftEnum(Type, metadata.type) as PrimitiveType;
    if (type !== field.primitiveType) {
      throw new Error(`chunk type not matching schema: ${type}`);
    }

    const pagesOffset = Number(metadata.data_page_offset);
    const dictionaryPageOffset = metadata.dictionary_page_offset;
    const validDictionaryPageOffset =
      dictionaryPageOffset !== undefined && Number(dictionaryPageOffset) > 0
        ? Number(dictionaryPageOffset)
        : undefined;
    const chunkOffset = Math.min(pagesOffset, validDictionaryPageOffset ?? pagesOffset);
    const chunkEnd = chunkOffset + Number(metadata.total_compressed_size);
    const chunkSize = Math.min(this.file.size - chunkOffset, Math.max(0, chunkEnd - chunkOffset));
    const chunkBuffer = new Uint8Array(this.file.handle, chunkOffset, chunkSize);
    const pagesRelativeOffset = pagesOffset - chunkOffset;
    const pagesSize = Math.min(
      chunkBuffer.length - pagesRelativeOffset,
      Math.max(0, chunkEnd - pagesOffset)
    );
    const context: ParquetReaderContext = {
      type,
      rLevelMax: field.rLevelMax,
      dLevelMax: field.dLevelMax,
      compression: 'UNCOMPRESSED',
      column: field,
      numValues: metadata.num_values,
      dictionary: [],
      decompressPage: this.getPageDecompressor('UNCOMPRESSED'),
      preserveBinary: this.props.preserveBinary,
      retainByteArrayViews: this.props.retainByteArrayViews,
      useTypedValueBuffers: this.props.useTypedValueBuffers,
      useTypedLevelBuffers: this.props.useTypedLevelBuffers,
      useArrowByteArrayBuffers: this.props.useArrowByteArrayBuffers,
      // Metadata proves whether the decoder may skip its otherwise duplicated page-header scan.
      // Keep the scan for mixed/unknown encodings: it is both a correctness guard and fallback.
      hasOnlyArrowByteArrayDataPages: hasOnlyArrowByteArrayDataPageEncodings(
        metadata.encodings,
        validDictionaryPageOffset
      ),
      verifyPageChecksums: this.props.verifyPageChecksums,
      int96AsTimestamp: this.props.int96AsTimestamp
    };
    let dictionary: unknown[] | undefined;
    if (validDictionaryPageOffset !== undefined) {
      const dictionaryRelativeOffset = validDictionaryPageOffset - chunkOffset;
      const dictionarySize = Math.min(
        Math.max(0, pagesOffset - validDictionaryPageOffset),
        chunkBuffer.length - dictionaryRelativeOffset,
        this.props.defaultDictionarySize
      );
      dictionary = decodeUncompressedDictionaryBuffer(
        chunkBuffer.subarray(dictionaryRelativeOffset, dictionaryRelativeOffset + dictionarySize),
        context
      );
    }
    return decodeUncompressedDataPages(
      chunkBuffer.subarray(pagesRelativeOffset, pagesRelativeOffset + pagesSize),
      {...context, dictionary}
    );
  }

  /**
   * Each row group contains column chunks for all the columns.
   */
  async readColumnChunk(
    schema: ParquetSchema,
    colChunk: ColumnChunk,
    signal?: AbortSignal,
    rowGroupOrdinal = 0,
    columnOrdinal = 0,
    resolvedMetadata?: NonNullable<ColumnChunk['meta_data']>
  ): Promise<ParquetColumnChunk> {
    if (colChunk.file_path !== undefined && colChunk.file_path !== null) {
      throw new Error('external references are not supported');
    }

    const metadata = resolvedMetadata || colChunk.meta_data;
    if (!metadata) {
      throw new Error('Parquet column metadata is missing');
    }
    const field = schema.findField(metadata.path_in_schema);
    const type: PrimitiveType = getThriftEnum(Type, metadata.type) as any;

    if (type !== field.primitiveType) {
      throw new Error(`chunk type not matching schema: ${type}`);
    }

    const compression: ParquetCompression = getThriftEnum(CompressionCodec, metadata.codec) as any;

    const pagesOffset = Number(metadata.data_page_offset);
    const dictionaryPageOffset = metadata.dictionary_page_offset;
    const validDictionaryPageOffset =
      dictionaryPageOffset !== undefined && Number(dictionaryPageOffset) > 0
        ? Number(dictionaryPageOffset)
        : undefined;
    const chunkOffset = Math.min(pagesOffset, validDictionaryPageOffset ?? pagesOffset);
    const chunkEnd = chunkOffset + Number(metadata.total_compressed_size);
    const chunkSize = Math.min(this.file.size - chunkOffset, Math.max(0, chunkEnd - chunkOffset));
    const chunkBuffer = await this.readBytes(chunkOffset, chunkSize, signal);
    const pagesRelativeOffset = pagesOffset - chunkOffset;
    const pagesSize = Math.min(
      chunkBuffer.length - pagesRelativeOffset,
      Math.max(0, chunkEnd - pagesOffset)
    );

    const context: ParquetReaderContext = {
      type,
      rLevelMax: field.rLevelMax,
      dLevelMax: field.dLevelMax,
      compression,
      column: field,
      numValues: metadata.num_values,
      dictionary: [],
      decompressPage: this.getPageDecompressor(compression),
      // Options - TBD is this the right place for these?
      preserveBinary: this.props.preserveBinary,
      retainByteArrayViews: this.props.retainByteArrayViews,
      useTypedValueBuffers: this.props.useTypedValueBuffers,
      useTypedLevelBuffers: this.props.useTypedLevelBuffers,
      useArrowByteArrayBuffers: this.props.useArrowByteArrayBuffers,
      // Avoid parsing every page header twice when trusted column metadata already establishes the
      // direct Arrow byte-array invariant. Unknown/mixed encodings retain the defensive scan.
      hasOnlyArrowByteArrayDataPages: hasOnlyArrowByteArrayDataPageEncodings(
        metadata.encodings,
        validDictionaryPageOffset
      ),
      verifyPageChecksums: this.props.verifyPageChecksums,
      int96AsTimestamp: this.props.int96AsTimestamp
    };

    let dictionary: any[] | undefined;

    if (validDictionaryPageOffset !== undefined) {
      const dictionaryRelativeOffset = validDictionaryPageOffset - chunkOffset;
      const dictionarySize = Math.min(
        Math.max(0, pagesOffset - validDictionaryPageOffset),
        chunkBuffer.length - dictionaryRelativeOffset,
        this.props.defaultDictionarySize
      );
      const dictionaryBuffer = chunkBuffer.subarray(
        dictionaryRelativeOffset,
        dictionaryRelativeOffset + dictionarySize
      );
      const decodedDictionaryBuffer = colChunk.crypto_metadata
        ? await this.decryptColumnPages(
            dictionaryBuffer,
            context,
            rowGroupOrdinal,
            columnOrdinal,
            this.getColumnKeyMetadata(colChunk),
            true
          )
        : dictionaryBuffer;
      dictionary = await decodeDictionaryBuffer(decodedDictionaryBuffer, context);
    }

    dictionary = context.dictionary?.length ? context.dictionary : dictionary;
    const pagesBuf = colChunk.crypto_metadata
      ? await this.decryptColumnPages(
          chunkBuffer.subarray(pagesRelativeOffset, pagesRelativeOffset + pagesSize),
          context,
          rowGroupOrdinal,
          columnOrdinal,
          this.getColumnKeyMetadata(colChunk)
        )
      : chunkBuffer.subarray(pagesRelativeOffset, pagesRelativeOffset + pagesSize);
    return await decodeDataPages(pagesBuf, {...context, dictionary});
  }

  /** Decrypts the length-prefixed page header and data modules in one column chunk. */
  private async decryptColumnPages(
    encryptedPages: Uint8Array,
    context: ParquetReaderContext,
    rowGroupOrdinal: number,
    columnOrdinal: number,
    keyMetadata: Uint8Array | undefined,
    includesDictionary = false,
    dataPageOrdinalStart = 0
  ): Promise<Uint8Array> {
    if (!this.encryptionContext || !this.props.keyRetriever) {
      throw new Error('Encrypted Parquet pages require parquet.keyRetriever');
    }
    const plaintextPages: Uint8Array[] = [];
    let offset = 0;
    let dataPageOrdinal = dataPageOrdinalStart;
    let pageIndex = 0;
    while (offset < encryptedPages.length) {
      const headerModule = readParquetEncryptedModule(encryptedPages, offset);
      offset = headerModule.nextOffset;
      const dictionaryPage = includesDictionary && pageIndex === 0;
      const headerModuleType: ParquetEncryptionModule = dictionaryPage
        ? 'dictionary-page-header'
        : 'data-page-header';
      const headerAad = createParquetModuleAad(
        this.encryptionContext.aadPrefix,
        this.encryptionContext.fileUnique,
        headerModuleType,
        rowGroupOrdinal,
        columnOrdinal,
        dictionaryPage ? undefined : dataPageOrdinal
      );
      const headerBytes = await decryptParquetModule(headerModule.bytes, {
        algorithm: this.encryptionContext.algorithm,
        aad: headerAad,
        keyMetadata,
        keyRetriever: this.getCachedKeyRetriever()
      });
      const {pageHeader} = decodePageHeader(headerBytes);
      const pageType = getThriftEnum(PageType, pageHeader.type);
      const dataModule = readParquetEncryptedModule(encryptedPages, offset);
      offset = dataModule.nextOffset;
      const dataAad = createParquetModuleAad(
        this.encryptionContext.aadPrefix,
        this.encryptionContext.fileUnique,
        dictionaryPage ? 'dictionary-page' : 'data-page',
        rowGroupOrdinal,
        columnOrdinal,
        dictionaryPage ? undefined : dataPageOrdinal
      );
      const dataBytes = await decryptParquetModule(dataModule.bytes, {
        algorithm: this.encryptionContext.algorithm,
        aad: dataAad,
        keyMetadata,
        keyRetriever: this.getCachedKeyRetriever(),
        page: true
      });
      plaintextPages.push(serializeThrift(pageHeader), dataBytes);
      if (pageType !== 'DICTIONARY_PAGE') dataPageOrdinal++;
      pageIndex++;
    }
    const plaintextLength = plaintextPages.reduce((total, page) => total + page.length, 0);
    const plaintext = new Uint8Array(plaintextLength);
    let plaintextOffset = 0;
    for (const page of plaintextPages) {
      plaintext.set(page, plaintextOffset);
      plaintextOffset += page.length;
    }
    return plaintext;
  }

  /** Resolves the key metadata reference for an encrypted column. */
  private getColumnKeyMetadata(columnChunk: ColumnChunk): Uint8Array | undefined {
    return (
      columnChunk.crypto_metadata?.ENCRYPTION_WITH_COLUMN_KEY?.key_metadata ??
      this.encryptionContext?.footerKeyMetadata ??
      this.encryptionContext?.footerSigningKeyMetadata
    );
  }

  /** Reads and decodes contiguous data pages that begin and end on complete row boundaries. */
  async readColumnChunkRange(
    schema: ParquetSchema,
    columnChunk: ColumnChunk,
    rowRange: ParquetRowRange,
    pages: readonly ParquetDataPageLocation[],
    signal?: AbortSignal,
    rowGroupOrdinal = 0,
    columnOrdinal = 0,
    resolvedMetadata?: NonNullable<ColumnChunk['meta_data']>
  ): Promise<ParquetColumnChunk> {
    if (columnChunk.file_path !== undefined && columnChunk.file_path !== null) {
      throw new Error('external references are not supported');
    }
    const columnMetadata = resolvedMetadata || columnChunk.meta_data;
    if (!columnMetadata) {
      throw new Error('Parquet column metadata is missing');
    }
    const encrypted = Boolean(columnChunk.crypto_metadata);
    const field = schema.findField(columnMetadata.path_in_schema);
    const type: PrimitiveType = getThriftEnum(Type, columnMetadata.type) as any;
    if (type !== field.primitiveType) {
      throw new Error(`chunk type not matching schema: ${type}`);
    }
    const compression: ParquetCompression = getThriftEnum(
      CompressionCodec,
      columnMetadata.codec
    ) as any;
    const overlappingPages = pages.filter(
      page => page.endRowIndex > rowRange.start && page.firstRowIndex < rowRange.end
    );
    if (!overlappingPages.length) {
      throw new Error('Parquet page plan does not overlap the requested row range');
    }
    let firstPageIndex = pages.indexOf(overlappingPages[0]);
    const lastPage = overlappingPages[overlappingPages.length - 1];
    let firstPage = pages[firstPageIndex];
    const context: ParquetReaderContext = {
      type,
      rLevelMax: field.rLevelMax,
      dLevelMax: field.dLevelMax,
      compression,
      column: field,
      // Repeated leaves have one level entry per physical value, not one per logical row. Let the
      // page decoder consume the selected page range and preserve all repetition levels.
      numValues:
        field.rLevelMax === 0
          ? new CompactInt64(lastPage.endRowIndex - firstPage.firstRowIndex)
          : undefined,
      dictionary: [],
      decompressPage: this.getPageDecompressor(compression),
      preserveBinary: this.props.preserveBinary,
      retainByteArrayViews: this.props.retainByteArrayViews,
      useTypedValueBuffers: this.props.useTypedValueBuffers,
      useArrowByteArrayBuffers: this.props.useArrowByteArrayBuffers,
      verifyPageChecksums: this.props.verifyPageChecksums,
      int96AsTimestamp: this.props.int96AsTimestamp
    };

    let dictionary: any[] | undefined;
    const dictionaryPageOffset = Number(columnMetadata.dictionary_page_offset);
    if (Number.isSafeInteger(dictionaryPageOffset) && dictionaryPageOffset > 0) {
      const dictionaryLength = Math.max(0, pages[0].offset - dictionaryPageOffset);
      const dictionaryBuffer = await this.readBytes(dictionaryPageOffset, dictionaryLength, signal);
      const decodedDictionaryBuffer = encrypted
        ? await this.decryptColumnPages(
            dictionaryBuffer,
            context,
            rowGroupOrdinal,
            columnOrdinal,
            this.getColumnKeyMetadata(columnChunk),
            true
          )
        : dictionaryBuffer;
      dictionary = await decodeDictionaryBuffer(decodedDictionaryBuffer, context);
    }

    if (field.rLevelMax !== 0) {
      // Probe predecessor pages independently, then decode the final range once. This avoids
      // quadratic re-decoding when a large repeated row spans many pages.
      while (firstPageIndex > 0) {
        const probeBuffer = await this.readBytes(
          firstPage.offset,
          firstPage.compressedByteLength,
          signal
        );
        const decodedProbeBuffer = encrypted
          ? await this.decryptColumnPages(
              probeBuffer,
              context,
              rowGroupOrdinal,
              columnOrdinal,
              this.getColumnKeyMetadata(columnChunk),
              false,
              firstPageIndex
            )
          : probeBuffer;
        const probe = await decodeDataPages(decodedProbeBuffer, {...context, dictionary});
        if (probe.rlevels[0] === 0) {
          break;
        }
        firstPage = pages[--firstPageIndex];
      }
    }
    const dataLength = lastPage.offset + lastPage.compressedByteLength - firstPage.offset;
    const dataBuffer = await this.readBytes(firstPage.offset, dataLength, signal);
    const decodedDataBuffer = encrypted
      ? await this.decryptColumnPages(
          dataBuffer,
          context,
          rowGroupOrdinal,
          columnOrdinal,
          this.getColumnKeyMetadata(columnChunk),
          false,
          firstPageIndex
        )
      : dataBuffer;
    const decoded = await decodeDataPages(decodedDataBuffer, {...context, dictionary});
    if (field.rLevelMax !== 0) {
      const rowStart = rowRange.start - firstPage.firstRowIndex;
      return sliceRepeatedColumnChunk(
        decoded,
        Math.max(0, rowStart),
        rowRange.end - rowRange.start,
        field.dLevelMax
      );
    }
    const relativeStart = rowRange.start - firstPage.firstRowIndex;
    const relativeEnd = relativeStart + rowRange.end - rowRange.start;
    return sliceNonRepeatedColumnChunk(decoded, field.dLevelMax, relativeStart, relativeEnd);
  }

  /**
   * Getting dictionary for allows to flatten values by indices.
   * @param dictionaryPageOffset
   * @param context
   * @param pagesOffset
   * @returns
   */
  async getDictionary(
    dictionaryPageOffset: number,
    context: ParquetReaderContext,
    pagesOffset: number,
    signal?: AbortSignal
  ): Promise<any[]> {
    if (dictionaryPageOffset === 0) {
      // dictionarySize = Math.min(this.fileSize - pagesOffset, this.defaultDictionarySize);
      // pagesBuf = await this.read(pagesOffset, dictionarySize);

      // In this case we are working with parquet-mr files format. Problem is described below:
      // https://stackoverflow.com/questions/55225108/why-is-dictionary-page-offset-0-for-plain-dictionary-encoding
      // We need to get dictionary page from column chunk if it exists.
      // Now if we use code commented above we don't get DICTIONARY_PAGE we get DATA_PAGE instead.
      return [];
    }

    const dictionarySize = Math.min(
      Math.max(0, pagesOffset - dictionaryPageOffset),
      this.file.size - dictionaryPageOffset,
      this.props.defaultDictionarySize
    );
    const pagesBuf = await this.readBytes(dictionaryPageOffset, dictionarySize, signal);
    return await decodeDictionaryBuffer(pagesBuf, context);
  }
}

/** Returns a column path available without decrypting column metadata when possible. */
function getColumnChunkPath(columnChunk: ColumnChunk): string[] | undefined {
  return (
    columnChunk.meta_data?.path_in_schema ??
    columnChunk.crypto_metadata?.ENCRYPTION_WITH_COLUMN_KEY?.path_in_schema
  );
}

/** Builds a stable cache key while preserving module scope for context-dependent key providers. */
function createEncryptionKeyCacheKey(
  algorithm: ParquetEncryptionAlgorithm,
  keyMetadata: Uint8Array | undefined,
  aad: Uint8Array,
  aadPrefixByteLength: number | undefined,
  fileUniqueByteLength: number | undefined
): string {
  const metadataKey = keyMetadata ? Array.from(keyMetadata).join(',') : 'footer';
  if (fileUniqueByteLength === undefined) {
    return `${algorithm}:${metadataKey}:aad:${Array.from(aad).join(',')}`;
  }

  const moduleOffset = (aadPrefixByteLength ?? 0) + fileUniqueByteLength;
  if (moduleOffset + 5 > aad.byteLength) {
    return `${algorithm}:${metadataKey}:aad:${Array.from(aad).join(',')}`;
  }

  const moduleType = aad[moduleOffset];
  if (moduleType === 0) {
    return `${algorithm}:${metadataKey}:footer`;
  }
  const view = new DataView(
    aad.buffer,
    aad.byteOffset + moduleOffset,
    aad.byteLength - moduleOffset
  );
  const rowGroupOrdinal = view.getInt16(1, true);
  const columnOrdinal = view.getInt16(3, true);
  return `${algorithm}:${metadataKey}:module:${moduleType}:row-group:${rowGroupOrdinal}:column:${columnOrdinal}`;
}

/** Returns the original row-group ordinal for a worker-reduced column list. */
function getPhysicalColumnOrdinal(columnChunk: ColumnChunk, fallbackOrdinal: number): number {
  return (
    (columnChunk as ColumnChunk & {parquetColumnOrdinal?: number}).parquetColumnOrdinal ??
    fallbackOrdinal
  );
}

/** Decodes one dictionary page from an already-read column-chunk range. */
async function decodeDictionaryBuffer(
  dictionaryBuffer: Uint8Array,
  context: ParquetReaderContext
): Promise<any[]> {
  const cursor = {buffer: dictionaryBuffer, offset: 0, size: dictionaryBuffer.length};
  const decodedPage = await decodePage(cursor, context);
  return decodedPage.dictionary!;
}

/** Slices one decoded non-repeated column chunk while preserving optional-value alignment. */
function sliceNonRepeatedColumnChunk(
  columnChunk: ParquetColumnChunk,
  definitionLevelMaximum: number,
  start: number,
  end: number
): ParquetColumnChunk {
  const valueStart = countDefinedValues(columnChunk.dlevels, definitionLevelMaximum, 0, start);
  const valueEnd =
    valueStart + countDefinedValues(columnChunk.dlevels, definitionLevelMaximum, start, end);
  return {
    rlevels: columnChunk.rlevels.slice(start, end),
    dlevels: columnChunk.dlevels.slice(start, end),
    values: columnChunk.values.slice(valueStart, valueEnd) as typeof columnChunk.values,
    count: end - start,
    pageHeaders: columnChunk.pageHeaders
  };
}

/** Slices a repeated column by logical rows while preserving its level/value alignment. */
function sliceRepeatedColumnChunk(
  columnChunk: ParquetColumnChunk,
  rowStart: number,
  rowCount: number,
  definitionLevelMaximum: number
): ParquetColumnChunk {
  const rowStarts: number[] = [];
  for (let levelIndex = 0; levelIndex < columnChunk.rlevels.length; levelIndex++) {
    if (columnChunk.rlevels[levelIndex] === 0) {
      rowStarts.push(levelIndex);
    }
  }
  const levelStart = rowStarts[rowStart];
  const endRow = rowStart + rowCount;
  const levelEnd = rowStarts[endRow] ?? columnChunk.rlevels.length;
  if (levelStart === undefined || endRow > rowStarts.length || levelEnd < levelStart) {
    throw new Error('Parquet repeated page range does not contain the requested rows');
  }
  const valueStart = countDefinedValues(columnChunk.dlevels, definitionLevelMaximum, 0, levelStart);
  const valueEnd =
    valueStart +
    countDefinedValues(columnChunk.dlevels, definitionLevelMaximum, levelStart, levelEnd);
  return {
    rlevels: columnChunk.rlevels.slice(levelStart, levelEnd),
    dlevels: columnChunk.dlevels.slice(levelStart, levelEnd),
    values: columnChunk.values.slice(valueStart, valueEnd) as typeof columnChunk.values,
    count: levelEnd - levelStart,
    pageHeaders: columnChunk.pageHeaders
  };
}

/** Counts defined primitive values represented by one non-repeated level interval. */
function countDefinedValues(
  definitionLevels: ParquetLevelBuffer,
  definitionLevelMaximum: number,
  start: number,
  end: number
): number {
  let count = 0;
  for (let index = start; index < Math.min(end, definitionLevels.length); index++) {
    if (definitionLevels[index] === definitionLevelMaximum) {
      count++;
    }
  }
  return count;
}
