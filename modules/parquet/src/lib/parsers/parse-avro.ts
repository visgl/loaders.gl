// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import type {ArrowTable, ArrowTableBatch} from '@loaders.gl/schema';
import {makeTableScanBatch} from '@loaders.gl/loader-utils';
import type {ReadableFile} from '@loaders.gl/loader-utils';
import {decompressAvro} from '../../avro-compression';

export type AvroSchema =
  | string
  | AvroSchema[]
  | {
      type: AvroSchema | AvroSchema[];
      name?: string;
      aliases?: string[];
      logicalType?: string;
      precision?: number;
      scale?: number;
      fields?: AvroRecordField[];
      symbols?: string[];
      size?: number;
      items?: AvroSchema;
      values?: AvroSchema;
    };
type AvroField = {name: string; type: AvroSchema};

type AvroRecordField = AvroField & {aliases?: string[]; default?: unknown};
type AvroRecordSchema = {
  type: 'record';
  name?: string;
  aliases?: string[];
  fields?: AvroRecordField[];
};
type AvroFixedSchema = {type: 'fixed'; size: number};

const MAGIC = [0x4f, 0x62, 0x6a, 0x01];

/** Options for reader-side Avro schema resolution. */
export type AvroParseOptions = {
  readerSchema?: unknown;
  longType?: 'number' | 'bigint';
  schema?: unknown;
  encoding?: 'auto' | 'ocf' | 'raw' | 'single-object';
  validateFingerprint?: boolean;
  blockIndices?: number[];
  /** Additional headers sent with URL-backed range requests. */
  headers?: Record<string, string>;
  /** Abort signal for URL-backed range requests. */
  signal?: AbortSignal;
  /** Initial range size used to discover the OCF header. */
  rangeChunkSize?: number;
};

/** Metadata and byte locations for one Avro Object Container File block. */
export type AvroOCFBlock = {
  /** Number of records in the block. */
  count: number;
  /** Offset of the block count field. */
  offset: number;
  /** Offset of the compressed block payload. */
  dataOffset: number;
  /** Compressed payload length in bytes. */
  compressedSize: number;
  /** Offset of the 16-byte sync marker following the payload. */
  syncOffset: number;
};

/** Parsed Avro Object Container File header and block index. */
export type AvroOCF = {
  metadata: Map<string, Uint8Array>;
  schema: AvroSchema;
  codec: string;
  syncMarker: Uint8Array;
  blocks: AvroOCFBlock[];
};

/** Parsed Avro OCF header, including the first block byte offset. */
export type AvroOCFHeader = Omit<AvroOCF, 'blocks'> & {dataOffset: number};

/** Parses an Apache Avro Object Container File into an object-row table. */
export async function parseAvro(
  arrayBuffer: ArrayBuffer,
  options?: AvroParseOptions
): Promise<ArrowTable> {
  const bytes = new Uint8Array(arrayBuffer);
  if (options?.encoding === 'raw' || options?.encoding === 'single-object' || !hasMagic(bytes))
    return parseExternalAvroDatum(bytes, options);
  const data: Record<string, unknown>[] = [];
  for await (const value of readAvroRows(arrayBuffer, options)) data.push(value);
  return {shape: 'arrow-table', data: arrow.tableFromJSON(data)};
}

/** Inspects an Avro Object Container File without decompressing record blocks. */
export function parseAvroOCF(arrayBuffer: ArrayBuffer): AvroOCF {
  const reader = new AvroReader(new Uint8Array(arrayBuffer));
  const header = parseAvroOCFHeaderFromReader(reader);
  const blocks: AvroOCFBlock[] = [];
  while (!reader.done) {
    const offset = reader.position;
    const count = reader.readLong();
    if (count === 0) break;
    const compressedSize = reader.readLong();
    if (compressedSize < 0) throw new Error('Invalid negative Avro block size');
    const dataOffset = reader.position;
    reader.readFixed(compressedSize);
    const syncOffset = reader.position;
    reader.expectBytes(header.syncMarker, 'Avro block sync marker');
    blocks.push({
      count: Math.abs(count),
      offset,
      dataOffset,
      compressedSize,
      syncOffset
    });
  }
  return {...header, blocks};
}

/** Parses an Avro OCF header from a bounded byte range. */
export function parseAvroOCFHeader(arrayBuffer: ArrayBuffer): AvroOCFHeader {
  return parseAvroOCFHeaderFromReader(new AvroReader(new Uint8Array(arrayBuffer)));
}

/** Parses an OCF header from an existing reader and records its first block offset. */
function parseAvroOCFHeaderFromReader(reader: AvroReader): AvroOCFHeader {
  reader.expectBytes(MAGIC, 'Avro Object Container File header');
  const metadata = reader.readMap(() => reader.readBytes());
  const syncMarker = reader.readFixed(16).slice();
  const schemaText = decodeUtf8(metadata.get('avro.schema'));
  if (!schemaText) throw new Error('Avro file is missing the avro.schema metadata entry');
  const schema = JSON.parse(schemaText) as AvroSchema;
  const codec = decodeUtf8(metadata.get('avro.codec')) || 'null';
  return {metadata, schema, codec, syncMarker, dataOffset: reader.position};
}

/** Parses an Avro Object Container File into Arrow batches. */
export async function* parseAvroInBatches(
  arrayBuffer: ArrayBuffer,
  batchSize = 10_000,
  options?: AvroParseOptions
): AsyncIterable<ArrowTableBatch> {
  if (!Number.isInteger(batchSize) || batchSize <= 0)
    throw new Error('Avro batchSize must be positive');
  const bytes = new Uint8Array(arrayBuffer);
  if (options?.encoding === 'raw' || options?.encoding === 'single-object' || !hasMagic(bytes)) {
    const table = await parseAvro(arrayBuffer, options);
    yield makeTableScanBatch(table);
    return;
  }
  let data: Record<string, unknown>[] = [];
  for await (const value of readAvroRows(arrayBuffer, options)) {
    data.push(value);
    if (data.length >= batchSize) {
      yield createAvroBatch(data);
      data = [];
    }
  }
  if (data.length > 0) yield createAvroBatch(data);
}

/** Loads an Avro OCF from a URL, using HTTP ranges when the server supports them. */
export async function parseAvroFromUrl(
  url: string,
  options?: AvroParseOptions & {batchSize?: number}
): Promise<ArrowTable> {
  const data: Record<string, unknown>[] = [];
  for await (const batch of parseAvroInBatchesFromUrl(url, options))
    data.push(...(batch.data.toArray() as Record<string, unknown>[]));
  return {shape: 'arrow-table', data: arrow.tableFromJSON(data)};
}

/** Streams Arrow batches from a URL-backed Avro OCF using block-sized range reads. */
export async function* parseAvroInBatchesFromUrl(
  url: string,
  options?: AvroParseOptions & {batchSize?: number}
): AsyncIterable<ArrowTableBatch> {
  if (options?.encoding && options.encoding !== 'auto' && options.encoding !== 'ocf')
    throw new Error('URL-backed Avro loading currently supports OCF input only');
  const batchSize = options?.batchSize || 10_000;
  if (!Number.isInteger(batchSize) || batchSize <= 0)
    throw new Error('Avro batchSize must be positive');
  const rangeChunkSize = options?.rangeChunkSize || 1024 * 1024;
  if (!Number.isInteger(rangeChunkSize) || rangeChunkSize < 1024)
    throw new Error('Avro rangeChunkSize must be at least 1024 bytes');
  const initial = await fetchAvroRange(url, 0, rangeChunkSize - 1, options);
  if (!initial) throw new Error('Avro URL returned no data');
  if (initial.fullFile) {
    yield* parseAvroInBatches(initial.bytes.buffer as ArrayBuffer, batchSize, options);
    return;
  }
  const header = parseAvroOCFHeader(initial.bytes.buffer as ArrayBuffer);
  validateAvroCodec(header.codec);
  let offset = header.dataOffset;
  let blockIndex = 0;
  let batch: Record<string, unknown>[] = [];
  while (true) {
    const blockHeader = await fetchAvroRange(url, offset, offset + 31, options);
    if (!blockHeader) break;
    if (blockHeader.fullFile) {
      yield* parseAvroInBatches(blockHeader.bytes.buffer as ArrayBuffer, batchSize, options);
      return;
    }
    if (blockHeader.bytes.length === 0) break;
    const countResult = readAvroLongAt(blockHeader.bytes, 0);
    const sizeResult = readAvroLongAt(blockHeader.bytes, countResult.offset);
    if (countResult.value === 0) break;
    if (countResult.value < 0 || sizeResult.value < 0)
      throw new Error('Invalid Avro OCF block header');
    const dataOffset = offset + sizeResult.offset;
    const blockEnd = dataOffset + sizeResult.value + header.syncMarker.length - 1;
    const block = await fetchAvroRange(url, dataOffset, blockEnd, options);
    if (!block) throw new Error('Truncated Avro OCF block');
    const blockBytes = block.bytes;
    if (blockBytes.length < sizeResult.value + header.syncMarker.length)
      throw new Error('Truncated Avro OCF block payload');
    const syncOffset = sizeResult.value;
    for (let index = 0; index < header.syncMarker.length; index++)
      if (blockBytes[syncOffset + index] !== header.syncMarker[index])
        throw new Error('Invalid Avro OCF sync marker');
    const selected = !options?.blockIndices || options.blockIndices.includes(blockIndex);
    if (selected) {
      for await (const row of decodeAvroBlockRows(
        blockBytes.subarray(0, sizeResult.value),
        countResult.value,
        header,
        options
      )) {
        batch.push(row);
        if (batch.length >= batchSize) {
          yield createAvroBatch(batch);
          batch = [];
        }
      }
    }
    offset = dataOffset + sizeResult.value + header.syncMarker.length;
    blockIndex++;
  }
  if (batch.length > 0) yield createAvroBatch(batch);
}

/** Loads an Avro OCF from a random-access file using bounded reads. */
export async function parseAvroFromFile(
  file: ReadableFile,
  options?: AvroParseOptions & {batchSize?: number}
): Promise<ArrowTable> {
  const data: Record<string, unknown>[] = [];
  for await (const batch of parseAvroInBatchesFromFile(file, options))
    data.push(...(batch.data.toArray() as Record<string, unknown>[]));
  return {shape: 'arrow-table', data: arrow.tableFromJSON(data)};
}

/** Streams Arrow batches from a random-access Avro OCF file. */
export async function* parseAvroInBatchesFromFile(
  file: ReadableFile,
  options?: AvroParseOptions & {batchSize?: number}
): AsyncIterable<ArrowTableBatch> {
  const rangeChunkSize = options?.rangeChunkSize || 1024 * 1024;
  if (!Number.isInteger(rangeChunkSize) || rangeChunkSize < 1024)
    throw new Error('Avro rangeChunkSize must be at least 1024 bytes');
  const stat = file.stat ? await file.stat() : null;
  const fileSize = file.bigsize > 0n ? Number(file.bigsize) : file.size || stat?.size || 0;
  if (fileSize <= 0) throw new Error('Avro file size is required for random-access loading');
  if (fileSize <= rangeChunkSize) {
    yield* parseAvroInBatches(
      await file.read(0, fileSize, options?.signal),
      options?.batchSize,
      options
    );
    return;
  }
  const headerBytes = new Uint8Array(await file.read(0, rangeChunkSize, options?.signal));
  const header = parseAvroOCFHeader(headerBytes.buffer as ArrayBuffer);
  validateAvroCodec(header.codec);
  let offset = header.dataOffset;
  let blockIndex = 0;
  let batch: Record<string, unknown>[] = [];
  const batchSize = options?.batchSize || 10_000;
  while (offset < fileSize) {
    const blockHeader = new Uint8Array(
      await file.read(offset, Math.min(32, fileSize - offset), options?.signal)
    );
    const countResult = readAvroLongAt(blockHeader, 0);
    const sizeResult = readAvroLongAt(blockHeader, countResult.offset);
    if (countResult.value === 0) break;
    if (countResult.value < 0 || sizeResult.value < 0)
      throw new Error('Invalid Avro OCF block header');
    const dataOffset = offset + sizeResult.offset;
    const blockBytes = new Uint8Array(
      await file.read(dataOffset, sizeResult.value + header.syncMarker.length, options?.signal)
    );
    if (blockBytes.length < sizeResult.value + header.syncMarker.length)
      throw new Error('Truncated Avro OCF block payload');
    for (let index = 0; index < header.syncMarker.length; index++)
      if (blockBytes[sizeResult.value + index] !== header.syncMarker[index])
        throw new Error('Invalid Avro OCF sync marker');
    if (!options?.blockIndices || options.blockIndices.includes(blockIndex)) {
      for await (const row of decodeAvroBlockRows(
        blockBytes.subarray(0, sizeResult.value),
        countResult.value,
        header,
        options
      )) {
        batch.push(row);
        if (batch.length >= batchSize) {
          yield createAvroBatch(batch);
          batch = [];
        }
      }
    }
    offset = dataOffset + sizeResult.value + header.syncMarker.length;
    blockIndex++;
  }
  if (batch.length > 0) yield createAvroBatch(batch);
}

/** Decodes one Avro OCF block and applies the optional reader schema. */
async function* decodeAvroBlockRows(
  compressedBytes: Uint8Array,
  rowCount: number,
  header: AvroOCFHeader,
  options?: AvroParseOptions
): AsyncIterable<Record<string, unknown>> {
  const reader = new AvroReader(
    await decompressAvro(header.codec, compressedBytes),
    header.schema,
    options
  );
  for (let index = 0; index < rowCount; index++) {
    const value = reader.readValue(header.schema);
    if (!isRecord(value)) throw new Error('Avro root schema must be a record');
    yield options?.readerSchema
      ? resolveReaderRecord(value, header.schema, options.readerSchema as AvroSchema)
      : value;
  }
}

/** Reads a byte range and detects servers that ignore the Range header. */
async function fetchAvroRange(
  url: string,
  start: number,
  end: number,
  options?: AvroParseOptions
): Promise<{bytes: Uint8Array; fullFile: boolean} | null> {
  const headers = new Headers(options?.headers);
  headers.set('Range', `bytes=${start}-${end}`);
  const response = await fetch(url, {headers, signal: options?.signal});
  if (response.status === 416) return null;
  if (!response.ok) throw new Error(`Avro range request failed with HTTP ${response.status}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  return {bytes, fullFile: response.status !== 206};
}

/** Decodes one Avro zig-zag long from a bounded range. */
function readAvroLongAt(bytes: Uint8Array, start: number): {value: number; offset: number} {
  let encoded = 0;
  let shift = 0;
  let offset = start;
  while (offset < bytes.length) {
    const byte = bytes[offset++];
    encoded += (byte & 0x7f) * 2 ** shift;
    if (!(byte & 0x80))
      return {value: encoded % 2 === 0 ? encoded / 2 : -(encoded + 1) / 2, offset};
    shift += 7;
  }
  throw new Error('Truncated Avro OCF block header');
}

/** Validates codecs before making remote block requests. */
function validateAvroCodec(codec: string): void {
  if (!['null', 'deflate', 'snappy', 'zstandard', 'bzip2', 'xz'].includes(codec))
    throw new Error(`Avro codec "${codec}" is not supported`);
}

/** Parses a raw Avro datum or single-object encoded datum using an external schema. */
function parseExternalAvroDatum(bytes: Uint8Array, options?: AvroParseOptions): ArrowTable {
  const schema = options?.schema as AvroSchema | undefined;
  if (!schema) throw new Error('Avro raw and single-object encodings require avro.schema');
  const encoding =
    options?.encoding === 'auto' || !options?.encoding
      ? hasSingleObjectMarker(bytes)
        ? 'single-object'
        : 'raw'
      : options.encoding;
  let offset = 0;
  if (encoding === 'single-object') {
    if (!hasSingleObjectMarker(bytes))
      throw new Error('Invalid Avro single-object encoding marker');
    if (bytes.length < 10) throw new Error('Truncated Avro single-object encoding');
    const expectedFingerprint = new DataView(bytes.buffer, bytes.byteOffset + 2, 8).getBigUint64(
      0,
      true
    );
    if (options?.validateFingerprint !== false) {
      const actualFingerprint = getAvroSchemaFingerprint(schema);
      if (expectedFingerprint !== actualFingerprint)
        throw new Error('Avro single-object schema fingerprint does not match avro.schema');
    }
    offset = 10;
  }
  const reader = new AvroReader(bytes.subarray(offset), schema, options);
  const value = reader.readValue(schema);
  if (!isRecord(value)) throw new Error('Avro root schema must be a record');
  const resolved = options?.readerSchema
    ? resolveReaderRecord(value, schema, options.readerSchema as AvroSchema)
    : value;
  return {shape: 'arrow-table', data: arrow.tableFromJSON([resolved])};
}

/** Computes Avro's 64-bit Rabin fingerprint for a schema's parsing canonical form. */
export function getAvroSchemaFingerprint(schema: unknown): bigint {
  const canonicalForm = getAvroParsingCanonicalForm(schema as AvroSchema);
  let fingerprint = 0xc15d213aa4d7a795n;
  const table = getRabinFingerprintTable();
  for (const byte of new TextEncoder().encode(canonicalForm))
    fingerprint = (fingerprint >> 8n) ^ table[Number((fingerprint ^ BigInt(byte)) & 0xffn)];
  return fingerprint;
}

/** Returns the compact parsing canonical form used by Avro fingerprints. */
function getAvroParsingCanonicalForm(schema: AvroSchema): string {
  if (typeof schema === 'string') return JSON.stringify(schema);
  if (Array.isArray(schema)) return `[${schema.map(getAvroParsingCanonicalForm).join(',')}]`;
  if (Array.isArray(schema.type)) return getAvroParsingCanonicalForm(schema.type);
  if (typeof schema.type !== 'string') return getAvroParsingCanonicalForm(schema.type);
  switch (schema.type) {
    case 'record':
      return JSON.stringify({
        name: schema.name,
        type: 'record',
        fields: (schema.fields || []).map(field => ({
          name: field.name,
          type: JSON.parse(getAvroParsingCanonicalForm(field.type))
        }))
      });
    case 'enum':
      return JSON.stringify({name: schema.name, type: 'enum', symbols: schema.symbols || []});
    case 'fixed':
      return JSON.stringify({name: schema.name, type: 'fixed', size: schema.size});
    case 'array':
      return JSON.stringify({
        type: 'array',
        items: JSON.parse(getAvroParsingCanonicalForm(schema.items as AvroSchema))
      });
    case 'map':
      return JSON.stringify({
        type: 'map',
        values: JSON.parse(getAvroParsingCanonicalForm(schema.values as AvroSchema))
      });
    default:
      return JSON.stringify(schema.type);
  }
}

/** Builds the Avro Rabin fingerprint lookup table. */
function getRabinFingerprintTable(): bigint[] {
  const table: bigint[] = [];
  const polynomial = 0xc96c5795d7870f42n;
  for (let index = 0; index < 256; index++) {
    let value = BigInt(index);
    for (let bit = 0; bit < 8; bit++) value = value & 1n ? (value >> 1n) ^ polynomial : value >> 1n;
    table.push(value);
  }
  return table;
}

/** Checks for the Avro Object Container File marker. */
function hasMagic(bytes: Uint8Array): boolean {
  return MAGIC.every((value, index) => bytes[index] === value);
}

/** Checks for the Avro single-object encoding marker. */
function hasSingleObjectMarker(bytes: Uint8Array): boolean {
  return bytes.length >= 2 && bytes[0] === 0xc3 && bytes[1] === 0x01;
}

/** Reads decoded Avro records one data block at a time. */
async function* readAvroRows(
  arrayBuffer: ArrayBuffer,
  options?: AvroParseOptions
): AsyncIterable<Record<string, unknown>> {
  const bytes = new Uint8Array(arrayBuffer);
  const ocf = parseAvroOCF(arrayBuffer);
  const {schema, codec} = ocf;
  if (
    codec !== 'null' &&
    codec !== 'deflate' &&
    codec !== 'snappy' &&
    codec !== 'zstandard' &&
    codec !== 'bzip2' &&
    codec !== 'xz'
  )
    throw new Error(`Avro codec "${codec}" is not supported`);

  const blocks = options?.blockIndices
    ? options.blockIndices.map(index => {
        if (!Number.isInteger(index) || index < 0 || index >= ocf.blocks.length)
          throw new Error(`Avro block index ${index} is out of range`);
        return ocf.blocks[index];
      })
    : ocf.blocks;
  for (const blockInfo of blocks) {
    const rows = decodeAvroBlockRows(
      bytes.subarray(blockInfo.dataOffset, blockInfo.dataOffset + blockInfo.compressedSize),
      blockInfo.count,
      {
        schema,
        codec,
        syncMarker: ocf.syncMarker,
        metadata: ocf.metadata,
        dataOffset: 0
      },
      options
    );
    yield* rows;
  }
}

/** Wraps object rows in the loaders.gl Arrow batch shape. */
function createAvroBatch(data: Record<string, unknown>[]): ArrowTableBatch {
  return makeTableScanBatch({shape: 'arrow-table', data: arrow.tableFromJSON(data)});
}

/** Decodes UTF-8 metadata values. */
function decodeUtf8(value: Uint8Array | undefined): string | undefined {
  return value ? new TextDecoder().decode(value) : undefined;
}

/** Tests whether a decoded Avro value is an object record. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    !(value instanceof Uint8Array)
  );
}

/** Resolves a decoded writer record against a compatible reader record schema. */
function resolveReaderRecord(
  value: Record<string, unknown>,
  writerSchema: AvroSchema,
  readerSchema: AvroSchema
): Record<string, unknown> {
  const resolved = resolveReaderValue(value, writerSchema, readerSchema);
  if (!isRecord(resolved)) throw new Error('Avro reader schema root must be a record');
  return resolved;
}

/** Resolves one value using Avro reader-schema projection rules. */
function resolveReaderValue(
  value: unknown,
  writerSchema: AvroSchema,
  readerSchema: AvroSchema
): unknown {
  if (Array.isArray(readerSchema)) {
    const branch = readerSchema.find(candidate =>
      isReaderSchemaCompatible(value, writerSchema, candidate)
    );
    if (!branch) throw new Error('Avro reader union has no compatible branch');
    return resolveReaderValue(value, writerSchema, branch);
  }
  if (typeof readerSchema === 'string') {
    return isPrimitiveSchemaType(readerSchema)
      ? promoteAvroValue(value, getSchemaTypeForValue(writerSchema, value), readerSchema)
      : value;
  }
  if (Array.isArray(readerSchema.type))
    return resolveReaderValue(value, writerSchema, readerSchema.type);
  if (typeof readerSchema.type !== 'string')
    return resolveReaderValue(value, writerSchema, readerSchema.type);
  if (isPrimitiveSchemaType(readerSchema.type))
    return promoteAvroValue(value, getSchemaTypeForValue(writerSchema, value), readerSchema.type);
  if (readerSchema.type === 'record' && isRecord(value)) {
    validateRecordCompatibility(writerSchema, readerSchema as AvroRecordSchema);
    const writerFields = getRecordFields(writerSchema);
    const resolved: Record<string, unknown> = {};
    for (const readerField of readerSchema.fields || []) {
      const writerField = writerFields.find(
        field => field.name === readerField.name || readerField.aliases?.includes(field.name)
      );
      if (!writerField) {
        if (Object.prototype.hasOwnProperty.call(readerField, 'default')) {
          if (!isDefaultValueCompatible(readerField.default, readerField.type))
            throw new Error(`Avro reader default for field "${readerField.name}" is incompatible`);
          resolved[readerField.name] = readerField.default;
          continue;
        }
        throw new Error(`Avro reader field "${readerField.name}" has no writer value or default`);
      }
      resolved[readerField.name] = resolveReaderValue(
        value[writerField.name],
        writerField.type,
        readerField.type
      );
    }
    return resolved;
  }
  if (readerSchema.type === 'enum') {
    if (typeof value !== 'string' || !readerSchema.symbols?.includes(value))
      throw new Error(`Avro enum symbol "${String(value)}" is not present in the reader schema`);
    return value;
  }
  if (readerSchema.type === 'fixed') {
    const writerFixed = getFixedSchema(writerSchema);
    if (writerFixed && writerFixed.size !== readerSchema.size)
      throw new Error('Avro fixed schemas have incompatible sizes');
    if (!(value instanceof Uint8Array) || value.length !== readerSchema.size)
      throw new Error('Avro fixed value has an incompatible size');
    return value;
  }
  if (readerSchema.type === 'array' && Array.isArray(value)) {
    return value.map(item =>
      resolveReaderValue(item, writerSchema, readerSchema.items as AvroSchema)
    );
  }
  if (readerSchema.type === 'map' && value instanceof Map) {
    return new Map(
      [...value.entries()].map(([key, item]) => [
        key,
        resolveReaderValue(item, writerSchema, readerSchema.values as AvroSchema)
      ])
    );
  }
  return value;
}

/** Validates Avro record names and reader aliases during schema resolution. */
function validateRecordCompatibility(
  writerSchema: AvroSchema,
  readerSchema: AvroRecordSchema
): void {
  const writerRecord = getRecordSchema(writerSchema);
  if (
    writerRecord?.name &&
    readerSchema.name &&
    writerRecord.name !== readerSchema.name &&
    !readerSchema.aliases?.includes(writerRecord.name)
  )
    throw new Error(
      `Avro record names "${writerRecord.name}" and "${readerSchema.name}" are incompatible`
    );
}

/** Returns a record schema when the schema is a record object. */
function getRecordSchema(schema: AvroSchema): AvroRecordSchema | undefined {
  return !Array.isArray(schema) && typeof schema !== 'string' && schema.type === 'record'
    ? (schema as AvroRecordSchema)
    : undefined;
}

/** Returns a fixed schema when the schema is a fixed object. */
function getFixedSchema(schema: AvroSchema): AvroFixedSchema | undefined {
  return !Array.isArray(schema) && typeof schema !== 'string' && schema.type === 'fixed'
    ? (schema as AvroFixedSchema)
    : undefined;
}

/** Returns the primitive/container type name from a schema. */
function getSchemaType(schema: AvroSchema): string | undefined {
  if (typeof schema === 'string') return schema;
  if (Array.isArray(schema)) return undefined;
  return typeof schema.type === 'string' ? schema.type : getSchemaType(schema.type);
}

/** Resolves the writer type for a value when the writer schema is a union. */
function getSchemaTypeForValue(schema: AvroSchema, value: unknown): string | undefined {
  if (!Array.isArray(schema)) return getSchemaType(schema);
  if (value === null) return 'null';
  const candidateTypes = schema
    .map(candidate => getSchemaType(candidate))
    .filter((type): type is string => Boolean(type && type !== 'null'));
  if (typeof value === 'string')
    return candidateTypes.find(type => type === 'string') || candidateTypes[0];
  if (typeof value === 'boolean')
    return candidateTypes.find(type => type === 'boolean') || candidateTypes[0];
  if (typeof value === 'number' || typeof value === 'bigint')
    return (
      candidateTypes.find(type => ['int', 'long', 'float', 'double'].includes(type)) ||
      candidateTypes[0]
    );
  return candidateTypes[0];
}

/** Tests whether a decoded value can be resolved through one reader union branch. */
function isReaderSchemaCompatible(
  value: unknown,
  writerSchema: AvroSchema,
  readerSchema: AvroSchema
): boolean {
  if (Array.isArray(readerSchema))
    return readerSchema.some(branch => isReaderSchemaCompatible(value, writerSchema, branch));
  if (typeof readerSchema === 'string') {
    if (readerSchema === 'null') return value === null;
    if (value === null) return false;
    const writerType = getSchemaTypeForValue(writerSchema, value);
    return (
      !isPrimitiveSchemaType(readerSchema) ||
      writerType === readerSchema ||
      (writerType !== undefined &&
        (
          {int: ['long', 'float', 'double'], long: ['float', 'double'], float: ['double']}[
            writerType
          ] || []
        ).includes(readerSchema))
    );
  }
  if (Array.isArray(readerSchema.type))
    return isReaderSchemaCompatible(value, writerSchema, readerSchema.type);
  if (typeof readerSchema.type !== 'string')
    return isReaderSchemaCompatible(value, writerSchema, readerSchema.type);
  if (isPrimitiveSchemaType(readerSchema.type))
    return isReaderSchemaCompatible(value, writerSchema, readerSchema.type);
  if (readerSchema.type === 'record') return isRecord(value);
  if (readerSchema.type === 'enum') return typeof value === 'string';
  if (readerSchema.type === 'fixed') return value instanceof Uint8Array;
  if (readerSchema.type === 'array') return Array.isArray(value);
  if (readerSchema.type === 'map') return value instanceof Map;
  return true;
}

/** Validates a reader-schema default, including the union-first-branch rule. */
function isDefaultValueCompatible(value: unknown, schema: AvroSchema): boolean {
  if (Array.isArray(schema)) return schema.length > 0 && isDefaultValueCompatible(value, schema[0]);
  if (typeof schema === 'string') {
    if (schema === 'null') return value === null;
    if (schema === 'boolean') return typeof value === 'boolean';
    if (schema === 'string' || schema === 'bytes') return typeof value === 'string';
    if (['int', 'long', 'float', 'double'].includes(schema)) return typeof value === 'number';
    return true;
  }
  if (!schema || typeof schema !== 'object') return false;
  if (Array.isArray(schema.type)) return isDefaultValueCompatible(value, schema.type);
  if (typeof schema.type !== 'string') return isDefaultValueCompatible(value, schema.type);
  if (schema.type === 'fixed') return typeof value === 'string' || value instanceof Uint8Array;
  if (schema.type === 'enum')
    return typeof value === 'string' && schema.symbols?.includes(value) === true;
  if (schema.type === 'array') return Array.isArray(value);
  if (schema.type === 'map')
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
  if (schema.type === 'record')
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
  return isDefaultValueCompatible(value, schema.type);
}

/** Tests whether a schema type participates in Avro primitive promotion. */
function isPrimitiveSchemaType(type: string): boolean {
  return ['null', 'boolean', 'int', 'long', 'float', 'double', 'bytes', 'string'].includes(type);
}

/** Applies Avro's permitted numeric promotions and rejects incompatible changes. */
function promoteAvroValue(
  value: unknown,
  writerType: string | undefined,
  readerType: string
): unknown {
  if (writerType === readerType || readerType === 'null') return value;
  const promotions: Record<string, string[]> = {
    int: ['long', 'float', 'double'],
    long: ['float', 'double'],
    float: ['double']
  };
  if (writerType && promotions[writerType]?.includes(readerType)) {
    if (typeof value === 'bigint') return Number(value);
    return Number(value);
  }
  throw new Error(
    `Avro schema resolution cannot promote ${writerType || 'unknown'} to ${readerType}`
  );
}

/** Returns fields from a record schema, or an empty list for primitive schemas. */
function getRecordFields(schema: AvroSchema): AvroRecordField[] {
  if (typeof schema === 'string' || Array.isArray(schema) || schema.type !== 'record') return [];
  return schema.fields || [];
}

/** Small cursor-based decoder for Avro's binary encoding. */
class AvroReader {
  private offset = 0;
  private readonly namedTypes = new Map<string, AvroSchema>();
  private readonly longType: 'number' | 'bigint';

  constructor(
    private readonly bytes: Uint8Array,
    schema?: AvroSchema,
    options?: AvroParseOptions
  ) {
    this.longType = options?.longType || 'number';
    if (schema) registerNamedTypes(schema, this.namedTypes);
  }

  /** Whether all input bytes have been consumed. */
  get done(): boolean {
    return this.offset >= this.bytes.length;
  }

  /** Current byte offset within the input. */
  get position(): number {
    return this.offset;
  }

  /** Reads an Avro zig-zag encoded long. */
  readLong(): number {
    let value = 0;
    let shift = 0;
    let byte = 0;
    do {
      byte = this.readByte();
      value += (byte & 0x7f) * 2 ** shift;
      shift += 7;
    } while (byte & 0x80);
    return (value % 2 === 0 ? value : -(value + 1)) / 2;
  }

  /** Reads an Avro byte array. */
  readBytes(): Uint8Array {
    const length = this.readLong();
    if (length < 0) throw new Error('Invalid negative Avro byte array length');
    return this.readFixed(length);
  }

  /** Reads a fixed number of bytes. */
  readFixed(length: number): Uint8Array {
    this.ensure(length);
    const value = this.bytes.subarray(this.offset, this.offset + length);
    this.offset += length;
    return value;
  }

  /** Reads an Avro map whose values are decoded by the supplied function. */
  readMap<T>(readValue: () => T): Map<string, T> {
    const result = new Map<string, T>();
    for (let count = this.readLong(); count !== 0; count = this.readLong()) {
      const itemCount = Math.abs(count);
      if (count < 0) this.readLong();
      for (let index = 0; index < itemCount; index++) result.set(this.readString(), readValue());
    }
    return result;
  }

  /** Reads one value according to an Avro schema. */
  readValue(schema: AvroSchema): unknown {
    if (typeof schema === 'string') {
      const namedSchema = this.namedTypes.get(schema);
      return namedSchema ? this.readValue(namedSchema) : this.readPrimitive(schema);
    }
    if (Array.isArray(schema)) return this.readValue(schema[this.readLong()]);
    if (Array.isArray(schema.type)) return this.readValue(schema.type[this.readLong()]);
    if (typeof schema.type !== 'string') return this.readValue(schema.type);
    let value: unknown;
    switch (schema.type) {
      case 'record': {
        const record: Record<string, unknown> = {};
        for (const field of schema.fields || []) record[field.name] = this.readValue(field.type);
        value = record;
        break;
      }
      case 'enum': {
        const symbol = schema.symbols?.[this.readLong()];
        if (symbol === undefined) throw new Error('Invalid Avro enum index');
        value = symbol;
        break;
      }
      case 'fixed':
        value = this.readFixed(schema.size || 0);
        break;
      case 'array':
        value = this.readArray(schema.items as AvroSchema);
        break;
      case 'map':
        value = this.readMap(() => this.readValue(schema.values as AvroSchema));
        break;
      default:
        value = this.readPrimitive(schema.type);
        break;
    }
    return applyLogicalType(schema.logicalType, value, schema);
  }

  /** Reads one Avro primitive value. */
  readPrimitive(type: string): unknown {
    switch (type) {
      case 'null':
        return null;
      case 'boolean':
        return this.readByte() !== 0;
      case 'int':
        return this.readLong();
      case 'long':
        return this.readLongValue();
      case 'float':
        return this.readNumber(4, true);
      case 'double':
        return this.readNumber(8, true);
      case 'bytes':
        return this.readBytes();
      case 'string':
        return new TextDecoder().decode(this.readBytes());
      default:
        throw new Error(`Unsupported Avro schema type "${type}"`);
    }
  }

  /** Reads an Avro long while preserving 64-bit precision when requested. */
  private readLongValue(): number | bigint {
    let value = 0n;
    let shift = 0n;
    let byte: number;
    do {
      byte = this.readByte();
      value |= BigInt(byte & 0x7f) << shift;
      shift += 7n;
    } while (byte & 0x80);
    const decoded = (value >> 1n) ^ -(value & 1n);
    return this.longType === 'bigint' ? decoded : Number(decoded);
  }

  /** Reads an Avro array. */
  readArray(schema: AvroSchema): unknown[] {
    const result: unknown[] = [];
    for (let count = this.readLong(); count !== 0; count = this.readLong()) {
      const itemCount = Math.abs(count);
      if (count < 0) this.readLong();
      for (let index = 0; index < itemCount; index++) result.push(this.readValue(schema));
    }
    return result;
  }

  /** Reads one byte from the input. */
  private readByte(): number {
    this.ensure(1);
    return this.bytes[this.offset++];
  }

  /** Reads an IEEE-754 number. */
  private readNumber(length: number, littleEndian: boolean): number {
    const buffer = this.readFixed(length);
    return length === 4
      ? new DataView(buffer.buffer, buffer.byteOffset, length).getFloat32(0, littleEndian)
      : new DataView(buffer.buffer, buffer.byteOffset, length).getFloat64(0, littleEndian);
  }

  /** Reads an Avro UTF-8 string. */
  private readString(): string {
    return new TextDecoder().decode(this.readBytes());
  }

  /** Verifies and consumes a byte sequence. */
  expectBytes(expected: number[] | Uint8Array, description: string): void {
    const actual = this.readFixed(expected.length);
    for (let index = 0; index < expected.length; index++) {
      if (actual[index] !== expected[index]) throw new Error(`Invalid ${description}`);
    }
  }

  /** Ensures that a read stays inside the input buffer. */
  private ensure(length: number): void {
    if (length < 0 || this.offset + length > this.bytes.length)
      throw new Error('Unexpected end of Avro file');
  }
}

/** Registers named schemas so later string references can be decoded. */
function registerNamedTypes(schema: AvroSchema, namedTypes: Map<string, AvroSchema>): void {
  if (typeof schema === 'string') return;
  if (Array.isArray(schema)) {
    for (const branch of schema) registerNamedTypes(branch, namedTypes);
    return;
  }
  if (schema.name) namedTypes.set(schema.name, schema);
  if (Array.isArray(schema.type)) registerNamedTypes(schema.type, namedTypes);
  else if (typeof schema.type !== 'string') registerNamedTypes(schema.type, namedTypes);
  for (const field of schema.fields || []) registerNamedTypes(field.type, namedTypes);
  if (schema.items) registerNamedTypes(schema.items, namedTypes);
  if (schema.values) registerNamedTypes(schema.values, namedTypes);
}

/** Converts Avro logical primitives into JavaScript values suitable for Arrow. */
function applyLogicalType(
  logicalType: string | undefined,
  value: unknown,
  schema?: {precision?: number; scale?: number}
): unknown {
  if (logicalType === 'decimal' && value instanceof Uint8Array) {
    const scale = schema?.scale || 0;
    const unscaled = decodeSignedBytes(value);
    const digits = unscaled < 0n ? (-unscaled).toString() : unscaled.toString();
    if (schema?.precision !== undefined && digits.replace(/^0+/, '').length > schema.precision)
      throw new Error('Avro decimal value exceeds the declared precision');
    return Number(unscaled) / 10 ** scale;
  }
  if (logicalType === 'big-decimal' && value instanceof Uint8Array) return decodeBigDecimal(value);
  if (logicalType === 'uuid') {
    if (typeof value !== 'string' || !isUuid(value)) throw new Error('Invalid Avro UUID value');
    return value;
  }
  if (logicalType === 'duration' && value instanceof Uint8Array) {
    if (value.length !== 12) throw new Error('Avro duration must contain 12 bytes');
    const view = new DataView(value.buffer, value.byteOffset, value.byteLength);
    return {
      months: view.getUint32(0, true),
      days: view.getUint32(4, true),
      milliseconds: view.getUint32(8, true)
    };
  }
  if (typeof value === 'bigint') {
    if (logicalType === 'timestamp-micros') return new Date(Number(value / 1_000n));
    if (logicalType === 'timestamp-millis') return new Date(Number(value));
    if (logicalType === 'time-millis' || logicalType === 'time-micros') return value;
    if (logicalType === 'timestamp-nanos' || logicalType === 'local-timestamp-nanos') return value;
    return value;
  }
  if (typeof value !== 'number') return value;
  switch (logicalType) {
    case 'date':
      return new Date(value * 86_400_000);
    case 'timestamp-millis':
      return new Date(value);
    case 'timestamp-micros':
      return new Date(Math.floor(value / 1_000));
    case 'time-millis':
    case 'time-micros':
    case 'local-timestamp-millis':
    case 'local-timestamp-micros':
    case 'timestamp-nanos':
    case 'local-timestamp-nanos':
      return value;
    default:
      return value;
  }
}

/** Decodes Avro's nested big-decimal bytes and returns its value and scale. */
function decodeBigDecimal(bytes: Uint8Array): {value: number; scale: number} {
  let offset = 0;
  const readLong = (): number => {
    let encoded = 0;
    let shift = 0;
    while (true) {
      if (offset >= bytes.length) throw new Error('Truncated Avro big-decimal payload');
      const byte = bytes[offset++];
      encoded += (byte & 0x7f) * 2 ** shift;
      if (!(byte & 0x80)) return encoded % 2 === 0 ? encoded / 2 : -(encoded + 1) / 2;
      shift += 7;
    }
  };
  const length = readLong();
  if (length < 0 || !Number.isInteger(length) || offset + length > bytes.length)
    throw new Error('Invalid Avro big-decimal unscaled value');
  const unscaled = decodeSignedBytes(bytes.subarray(offset, offset + length));
  offset += length;
  const scale = readLong();
  if (!Number.isInteger(scale) || scale < 0 || offset !== bytes.length)
    throw new Error('Invalid Avro big-decimal scale');
  return {value: Number(unscaled) / 10 ** scale, scale};
}

/** Tests an Avro UUID string. */
function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

/** Decodes a big-endian signed two's-complement integer. */
function decodeSignedBytes(bytes: Uint8Array): bigint {
  let value = 0n;
  for (const byte of bytes) value = (value << 8n) | BigInt(byte);
  const signBit = 1n << BigInt(bytes.length * 8 - 1);
  return value & signBit ? value - (signBit << 1n) : value;
}
