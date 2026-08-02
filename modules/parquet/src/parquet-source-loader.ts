// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {CoreAPI, ReadableFile, SourceLoader} from '@loaders.gl/loader-utils';
import {BlobFile, DataSource} from '@loaders.gl/loader-utils';
import type {Schema} from '@loaders.gl/schema';

import {getSchemaFromParquetReader} from './lib/parsers/get-parquet-schema';
import {ParquetRangeFile} from './lib/sources/parquet-range-file';
import {ParquetFormat} from './parquet-format';
import type {
  ParquetColumnChunkMetadata,
  ParquetMetadataRequestOptions,
  ParquetObjectVersion,
  ParquetRowGroupMetadata,
  ParquetSourceLoaderOptions,
  ParquetSourceMetadata
} from './parquet-source-types';
import {CompressionCodec, type FileMetaData} from './parquetjs/parquet-thrift/index';
import {ParquetReader} from './parquetjs/parser/parquet-reader';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

type ParquetSourceInitialization = {
  file: ReadableFile;
  reader: ParquetReader;
  schema: Schema;
  fileMetadata: FileMetaData;
  metadata: ParquetSourceMetadata;
};

/** Source factory for range-backed Parquet metadata access. */
export const ParquetSourceLoader = {
  dataType: null as unknown as ParquetSource,
  batchType: null as never,
  ...ParquetFormat,
  id: 'parquet-source',
  module: 'parquet',
  name: 'ParquetSourceLoader',
  version: VERSION,
  type: 'parquet',
  fromUrl: true,
  fromBlob: true,

  options: {
    parquet: {
      headers: undefined!,
      preserveBinary: false
    },
    rangeRequests: {
      batchDelayMs: 0
    }
  },

  defaultOptions: {
    parquet: {
      headers: undefined!,
      preserveBinary: false
    },
    rangeRequests: {
      batchDelayMs: 0
    }
  },

  testURL: (url: string): boolean => /\.parquet(?:$|[?#])/i.test(url),
  createDataSource: (
    data: string | Blob,
    options: ParquetSourceLoaderOptions,
    coreApi?: CoreAPI
  ): ParquetSource => new ParquetSource(data, options, coreApi)
} as const satisfies SourceLoader<ParquetSource>;

/** Reusable Parquet source that opens and caches footer metadata and schema once. */
export class ParquetSource extends DataSource<string | Blob, ParquetSourceLoaderOptions> {
  /** Shared initialization for this source instance. */
  private initializationPromise: Promise<ParquetSourceInitialization> | null = null;
  /** File allocated during source initialization, including while it is opening. */
  private readableFile: ReadableFile | null = null;
  /** Whether this source has been permanently closed. */
  private closed = false;

  /** Creates a Parquet source backed by strict URL ranges or Blob slices. */
  constructor(data: string | Blob, options: ParquetSourceLoaderOptions, coreApi?: CoreAPI) {
    super(data, options, ParquetSourceLoader.defaultOptions, coreApi);
  }

  /** Returns the cached logical schema decoded from the Parquet footer. */
  async getSchema(options: {signal?: AbortSignal} = {}): Promise<Schema> {
    const initialization = await this.getInitialization(options.signal);
    return initialization.schema;
  }

  /** Returns normalized dataset, row-group, and column-chunk metadata. */
  async getMetadata(options: ParquetMetadataRequestOptions = {}): Promise<ParquetSourceMetadata> {
    const initialization = await this.getInitialization(options.signal);
    if (!options.formatSpecificMetadata) {
      return initialization.metadata;
    }
    return {
      ...initialization.metadata,
      formatSpecificMetadata: initialization.fileMetadata
    };
  }

  /** Closes the underlying readable file and aborts active remote requests. */
  async close(): Promise<void> {
    if (this.closed) {
      return;
    }
    this.closed = true;
    await this.readableFile?.close();
    const initialization = await this.initializationPromise?.catch(() => null);
    if (initialization?.file !== this.readableFile) {
      await initialization?.file.close();
    }
  }

  /** Returns cached initialization, resetting the cache when initialization fails. */
  private getInitialization(signal?: AbortSignal): Promise<ParquetSourceInitialization> {
    if (this.closed) {
      return Promise.reject(new Error('Parquet source is closed'));
    }
    if (!this.initializationPromise) {
      this.initializationPromise = this.initialize(signal).catch(error => {
        this.initializationPromise = null;
        throw error;
      });
    }
    return this.initializationPromise;
  }

  /** Opens the readable file and decodes its footer and schema once. */
  private async initialize(signal?: AbortSignal): Promise<ParquetSourceInitialization> {
    const file = await this.openFile(signal);
    try {
      const reader = new ParquetReader(file, {
        preserveBinary: this.options.parquet?.preserveBinary,
        signal
      });
      const fileMetadata = await reader.getFileMetadata();
      const schema = await getSchemaFromParquetReader(reader);
      const metadata = createParquetSourceMetadata(
        this.data,
        this.url,
        file,
        fileMetadata,
        file instanceof ParquetRangeFile ? file.objectVersion : undefined
      );
      // The initialization signal governs only footer/schema loading. Later row reads
      // receive their own signals in the selective-read tranche.
      reader.props.signal = undefined;
      return {file, reader, schema, fileMetadata, metadata};
    } catch (error) {
      await file.close();
      throw error;
    }
  }

  /** Opens a Blob file or probes a remote object with one bounded range request. */
  private async openFile(signal?: AbortSignal): Promise<ReadableFile> {
    if (typeof this.data !== 'string') {
      this.readableFile = new BlobFile(this.data);
      return this.readableFile;
    }
    const file = new ParquetRangeFile(this.url, {
      fetch: this.fetch,
      headers: this.options.parquet?.headers,
      rangeRequests: this.options.rangeRequests
    });
    this.readableFile = file;
    return await file.open(signal);
  }
}

/** Normalizes a decoded Parquet footer into source metadata. */
function createParquetSourceMetadata(
  data: string | Blob,
  url: string,
  file: ReadableFile,
  fileMetadata: FileMetaData,
  objectVersion?: ParquetObjectVersion
): ParquetSourceMetadata {
  const rowGroups = fileMetadata.row_groups.map((rowGroup, index) => {
    const columns = rowGroup.columns
      .map(columnChunk => columnChunk.meta_data)
      .filter(Boolean)
      .map(columnMetadata => createColumnChunkMetadata(columnMetadata!));
    return createRowGroupMetadata(
      index,
      Number(rowGroup.num_rows),
      Number(rowGroup.total_byte_size),
      columns
    );
  });

  return {
    name: getSourceName(data, url),
    url: url || undefined,
    fileByteLength: file.size,
    formatVersion: fileMetadata.version,
    createdBy: fileMetadata.created_by,
    rowCount: Number(fileMetadata.num_rows),
    rowGroupCount: rowGroups.length,
    keyValueMetadata: getKeyValueMetadata(fileMetadata),
    rowGroups,
    objectVersion: hasObjectVersion(objectVersion) ? objectVersion : undefined
  };
}

/** Normalizes a decoded Parquet column chunk. */
function createColumnChunkMetadata(
  columnMetadata: NonNullable<FileMetaData['row_groups'][number]['columns'][number]['meta_data']>
): ParquetColumnChunkMetadata {
  return {
    path: [...columnMetadata.path_in_schema],
    compression: CompressionCodec[columnMetadata.codec] || String(columnMetadata.codec),
    valueCount: Number(columnMetadata.num_values),
    compressedByteLength: Number(columnMetadata.total_compressed_size),
    uncompressedByteLength: Number(columnMetadata.total_uncompressed_size),
    dataPageOffset: Number(columnMetadata.data_page_offset),
    dictionaryPageOffset:
      columnMetadata.dictionary_page_offset === undefined
        ? undefined
        : Number(columnMetadata.dictionary_page_offset)
  };
}

/** Normalizes one decoded row group and derives its compressed byte length. */
function createRowGroupMetadata(
  index: number,
  rowCount: number,
  uncompressedByteLength: number,
  columns: ParquetColumnChunkMetadata[]
): ParquetRowGroupMetadata {
  return {
    index,
    rowCount,
    uncompressedByteLength,
    compressedByteLength: columns.reduce((sum, column) => sum + column.compressedByteLength, 0),
    columns
  };
}

/** Converts footer key/value pairs into an object. */
function getKeyValueMetadata(fileMetadata: FileMetaData): Record<string, string> {
  const result: Record<string, string> = {};
  for (const entry of fileMetadata.key_value_metadata || []) {
    if (entry.value !== undefined) {
      result[entry.key] = entry.value;
    }
  }
  return result;
}

/** Infers a stable display name from URL or File input. */
function getSourceName(data: string | Blob, url: string): string {
  const sourceName =
    typeof data !== 'string' && 'name' in data && typeof data.name === 'string'
      ? data.name
      : typeof data === 'string'
        ? url.split(/[?#]/)[0].split('/').pop() || 'parquet'
        : 'parquet';
  return sourceName.replace(/\.parquet$/i, '') || 'parquet';
}

/** Returns true when at least one HTTP object validator was captured. */
function hasObjectVersion(version?: ParquetObjectVersion): version is ParquetObjectVersion {
  return Boolean(version?.etag || version?.lastModified);
}
