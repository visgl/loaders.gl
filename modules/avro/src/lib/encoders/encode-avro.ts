// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ArrowTable} from '@loaders.gl/schema';
import {compressAvro, type AvroCodec} from '../../avro-compression';
import {getAvroSchemaFingerprint} from '../parsers/parse-avro';

/** Supported Avro schema representation for the first writer milestone. */
export type AvroSchema =
  | string
  | AvroSchema[]
  | {
      type: AvroSchema;
      name?: string;
      aliases?: string[];
      logicalType?: string;
      precision?: number;
      scale?: number;
      fields?: {name: string; type: AvroSchema}[];
      symbols?: string[];
      size?: number;
      items?: AvroSchema;
      values?: AvroSchema;
    };

/** Options for the Apache Avro writer. */
export type AvroWriterOptions = {
  avro?: {
    /** Output encoding. Raw output writes a sequence of binary records. */
    encoding?: 'ocf' | 'raw' | 'single-object';
    /** Explicit root record schema; otherwise it is derived from Arrow fields. */
    schema?: AvroSchema;
    /** Fixed 16-byte sync marker used for each output block. */
    syncMarker?: Uint8Array;
    /** Avro block codec. bzip2 and xz require the optional codec runtime. */
    codec?: AvroCodec;
    /** Target uncompressed block size in bytes. */
    blockSize?: number;
    /** Additional OCF metadata entries. Reserved Avro keys cannot be overridden. */
    metadata?: Record<string, string | Uint8Array>;
  };
};

const MAGIC = new Uint8Array([0x4f, 0x62, 0x6a, 0x01]);
const DEFAULT_SYNC_MARKER = new Uint8Array([
  0x6c, 0x6f, 0x61, 0x64, 0x65, 0x72, 0x73, 0x2e, 0x67, 0x6c, 0x2d, 0x61, 0x76, 0x72, 0x6f, 0x31
]);

/** Encodes an Arrow table as a null-codec Avro Object Container File. */
export async function encodeAvro(
  table: ArrowTable,
  options?: AvroWriterOptions
): Promise<ArrayBuffer> {
  if (options?.avro?.encoding === 'raw') return encodeAvroRaw(table, options);
  if (options?.avro?.encoding === 'single-object') return encodeAvroSingleObject(table, options);
  const chunks: Uint8Array[] = [];
  for await (const chunk of encodeAvroInChunks(table, options)) chunks.push(chunk);
  return concatBytes(chunks).buffer as ArrayBuffer;
}

/** Encodes an Arrow table as an async sequence of OCF header and block chunks. */
export async function* encodeAvroInChunks(
  table: ArrowTable,
  options?: AvroWriterOptions
): AsyncIterable<Uint8Array> {
  if (options?.avro?.encoding === 'raw' || options?.avro?.encoding === 'single-object')
    throw new Error('Avro raw and single-object encodings do not support chunked OCF output');
  const schema = options?.avro?.schema || deriveRecordSchema(table);
  if (!isRecordSchema(schema)) throw new Error('AvroWriter requires a root record schema');
  const namedTypes = collectNamedTypes(schema);
  const syncMarker = options?.avro?.syncMarker || DEFAULT_SYNC_MARKER;
  if (syncMarker.length !== 16) throw new Error('Avro sync markers must contain exactly 16 bytes');
  const codec = options?.avro?.codec || 'null';
  const blockSize = options?.avro?.blockSize || 64 * 1024;
  if (blockSize <= 0) throw new Error('Avro block size must be positive');

  yield createAvroHeader(schema, codec, syncMarker, options?.avro?.metadata);
  const fields = schema.fields || [];
  const columns = fields.map(field => table.data.getChild(field.name));
  let block = new ByteWriter();
  let blockRowCount = 0;
  for (let rowIndex = 0; rowIndex < table.data.numRows; rowIndex++) {
    const record: Record<string, unknown> = {};
    for (let fieldIndex = 0; fieldIndex < fields.length; fieldIndex++) {
      record[fields[fieldIndex].name] = columns[fieldIndex]?.get(rowIndex);
    }
    const row = new ByteWriter();
    writeValue(row, schema, record, namedTypes);
    if (blockRowCount > 0 && block.length + row.length > blockSize) {
      yield await encodeAvroBlock(codec, syncMarker, blockRowCount, block.finish());
      block = new ByteWriter();
      blockRowCount = 0;
    }
    block.writeBytes(row.finish());
    blockRowCount++;
  }
  if (blockRowCount > 0)
    yield await encodeAvroBlock(codec, syncMarker, blockRowCount, block.finish());
}

/** Encodes exactly one Arrow record as a raw Avro binary datum. */
function encodeAvroRaw(table: ArrowTable, options: AvroWriterOptions): ArrayBuffer {
  if (table.data.numRows !== 1) throw new Error('Avro raw encoding requires exactly one table row');
  const schema = options.avro?.schema || deriveRecordSchema(table);
  if (!isRecordSchema(schema)) throw new Error('AvroWriter requires a root record schema');
  const namedTypes = collectNamedTypes(schema);
  const output = new ByteWriter();
  const fields = schema.fields || [];
  const record: Record<string, unknown> = {};
  for (const field of fields) record[field.name] = table.data.getChild(field.name)?.get(0);
  writeValue(output, schema, record, namedTypes);
  return output.finish().buffer as ArrayBuffer;
}

/** Encodes exactly one Arrow record using Avro's single-object encoding. */
function encodeAvroSingleObject(table: ArrowTable, options: AvroWriterOptions): ArrayBuffer {
  if (table.data.numRows !== 1)
    throw new Error('Avro single-object encoding requires exactly one table row');
  const schema = options.avro?.schema || deriveRecordSchema(table);
  if (!isRecordSchema(schema)) throw new Error('AvroWriter requires a root record schema');
  const record: Record<string, unknown> = {};
  for (const field of schema.fields || [])
    record[field.name] = table.data.getChild(field.name)?.get(0);
  const writer = new ByteWriter();
  writeValue(writer, schema, record, collectNamedTypes(schema));
  const output = new Uint8Array(10 + writer.length);
  output.set([0xc3, 0x01]);
  new DataView(output.buffer).setBigUint64(2, getAvroSchemaFingerprint(schema), true);
  output.set(writer.finish(), 10);
  return output.buffer;
}

/** Encodes the OCF header and metadata map. */
function createAvroHeader(
  schema: AvroSchema,
  codec: AvroCodec,
  syncMarker: Uint8Array,
  customMetadata?: Record<string, string | Uint8Array>
): Uint8Array {
  const metadata = Object.entries(customMetadata || {});
  for (const [key] of metadata)
    if (key === 'avro.schema' || key === 'avro.codec')
      throw new Error(`Avro metadata key "${key}" is reserved`);
  const output = new ByteWriter();
  output.writeBytes(MAGIC);
  output.writeLong(2 + metadata.length);
  output.writeString('avro.schema');
  output.writeBytesValue(new TextEncoder().encode(JSON.stringify(schema)));
  output.writeString('avro.codec');
  output.writeString(codec);
  for (const [key, value] of metadata) {
    output.writeString(key);
    if (typeof value === 'string') output.writeString(value);
    else output.writeBytesValue(value);
  }
  output.writeLong(0);
  output.writeBytes(syncMarker);
  return output.finish();
}

/** Encodes one OCF block as a self-contained output chunk. */
async function encodeAvroBlock(
  codec: AvroCodec,
  syncMarker: Uint8Array,
  count: number,
  uncompressedBytes: Uint8Array
): Promise<Uint8Array> {
  const compressedBytes = await compressAvro(codec, uncompressedBytes);
  const output = new ByteWriter();
  output.writeLong(count);
  output.writeLong(compressedBytes.length);
  output.writeBytes(compressedBytes);
  output.writeBytes(syncMarker);
  return output.finish();
}

/** Concatenates output chunks into one exact byte array. */
function concatBytes(chunks: Uint8Array[]): Uint8Array {
  const output = new Uint8Array(chunks.reduce((length, chunk) => length + chunk.length, 0));
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.length;
  }
  return output;
}

/** Derives a flat Avro record schema from Arrow fields. */
function deriveRecordSchema(table: ArrowTable): AvroSchema {
  return {
    type: 'record',
    name: 'ArrowRecord',
    fields: table.data.schema.fields.map(field => ({
      name: field.name,
      type: deriveFieldSchema(field.type.toString())
    }))
  };
}

/** Maps common Arrow type names to Avro primitive types. */
function deriveFieldSchema(typeName: string): AvroSchema {
  const type = typeName.toLowerCase();
  if (type.includes('utf8') || type.includes('string')) return 'string';
  if (type.includes('binary')) return 'bytes';
  if (type.includes('bool')) return 'boolean';
  if (type.includes('dateday')) return {type: 'int', logicalType: 'date'};
  if (type.includes('timestampmillisecond')) return {type: 'long', logicalType: 'timestamp-millis'};
  if (type.includes('timestampmicrosecond')) return {type: 'long', logicalType: 'timestamp-micros'};
  if (type.includes('int8') || type.includes('int16') || type.includes('int32')) return 'int';
  if (type.includes('int64') || type.includes('uint64')) return 'long';
  if (type.includes('float32')) return 'float';
  if (type.includes('float64')) return 'double';
  throw new Error(`AvroWriter cannot derive a schema for Arrow type "${typeName}"`);
}

/** Checks whether a schema is a named record schema. */
function isRecordSchema(schema: AvroSchema): schema is Extract<AvroSchema, {fields?: unknown}> {
  return !Array.isArray(schema) && typeof schema !== 'string' && schema.type === 'record';
}

/** Writes one value according to an Avro schema. */
function writeValue(
  writer: ByteWriter,
  inputSchema: AvroSchema,
  value: unknown,
  namedTypes: Map<string, AvroSchema>
): void {
  const schema = resolveSchema(inputSchema, namedTypes);
  if (typeof schema !== 'string' && !Array.isArray(schema) && schema.logicalType) {
    writeValue(
      writer,
      {...schema, logicalType: undefined},
      normalizeLogicalValue(schema.logicalType, value, schema),
      namedTypes
    );
    return;
  }
  if (Array.isArray(schema)) {
    const branchIndex = schema.findIndex(branch => canEncode(branch, value, namedTypes));
    if (branchIndex < 0) throw new Error('Value does not match any Avro union branch');
    writer.writeLong(branchIndex);
    writeValue(writer, schema[branchIndex], value, namedTypes);
    return;
  }
  if (typeof schema === 'string') {
    writePrimitive(writer, schema, value);
    return;
  }
  if (Array.isArray(schema.type)) {
    writeValue(writer, schema.type, value, namedTypes);
    return;
  }
  if (typeof schema.type !== 'string') {
    writeValue(writer, schema.type, value, namedTypes);
    return;
  }
  switch (schema.type) {
    case 'record':
      for (const field of schema.fields || [])
        writeValue(
          writer,
          field.type,
          (value as Record<string, unknown>)?.[field.name],
          namedTypes
        );
      break;
    case 'enum': {
      const index = schema.symbols?.indexOf(String(value)) ?? -1;
      if (index < 0) throw new Error(`Unknown Avro enum symbol "${String(value)}"`);
      writer.writeLong(index);
      break;
    }
    case 'fixed':
      writer.writeFixed(toBytes(value), schema.size || 0);
      break;
    case 'array': {
      const values = Array.isArray(value) ? value : [];
      if (values.length) {
        writer.writeLong(values.length);
        for (const item of values) writeValue(writer, schema.items as AvroSchema, item, namedTypes);
      }
      writer.writeLong(0);
      break;
    }
    case 'map': {
      const entries = value instanceof Map ? [...value.entries()] : Object.entries(value || {});
      if (entries.length) {
        writer.writeLong(entries.length);
        for (const [key, item] of entries) {
          writer.writeString(key);
          writeValue(writer, schema.values as AvroSchema, item, namedTypes);
        }
      }
      writer.writeLong(0);
      break;
    }
    default:
      writePrimitive(writer, schema.type, value);
  }
}

/** Checks whether a value can be encoded by a union branch. */
function canEncode(
  inputSchema: AvroSchema,
  value: unknown,
  namedTypes: Map<string, AvroSchema>
): boolean {
  const schema = resolveSchema(inputSchema, namedTypes);
  if (schema === 'null') return value == null;
  if (Array.isArray(schema)) return schema.some(branch => canEncode(branch, value, namedTypes));
  if (typeof schema === 'string') {
    if (schema === 'null') return value == null;
    if (value == null) return false;
    if (schema === 'boolean') return typeof value === 'boolean';
    if (schema === 'string') return typeof value === 'string';
    if (schema === 'bytes')
      return value instanceof Uint8Array || value instanceof ArrayBuffer || Array.isArray(value);
    if (schema === 'int' || schema === 'long' || schema === 'float' || schema === 'double')
      return typeof value === 'number' || typeof value === 'bigint';
    return true;
  }
  if (schema.logicalType) return value != null;
  if (Array.isArray(schema.type)) return canEncode(schema.type, value, namedTypes);
  if (typeof schema.type !== 'string') return canEncode(schema.type, value, namedTypes);
  if (schema.type === 'record')
    return isRecordSchema(schema) && value != null && typeof value === 'object';
  if (schema.type === 'array') return Array.isArray(value);
  if (schema.type === 'map') return value != null && typeof value === 'object';
  return value != null;
}

/** Resolves a named schema reference. */
function resolveSchema(schema: AvroSchema, namedTypes: Map<string, AvroSchema>): AvroSchema {
  if (typeof schema !== 'string') return schema;
  return namedTypes.get(schema) || schema;
}

/** Collects named schemas, including nested definitions. */
function collectNamedTypes(schema: AvroSchema): Map<string, AvroSchema> {
  const namedTypes = new Map<string, AvroSchema>();
  const visit = (currentSchema: AvroSchema): void => {
    if (typeof currentSchema === 'string') return;
    if (Array.isArray(currentSchema)) {
      for (const branch of currentSchema) visit(branch);
      return;
    }
    if (currentSchema.name) namedTypes.set(currentSchema.name, currentSchema);
    if (Array.isArray(currentSchema.type)) for (const branch of currentSchema.type) visit(branch);
    else if (typeof currentSchema.type !== 'string') visit(currentSchema.type);
    for (const field of currentSchema.fields || []) visit(field.type);
    if (currentSchema.items) visit(currentSchema.items);
    if (currentSchema.values) visit(currentSchema.values);
  };
  visit(schema);
  return namedTypes;
}

/** Converts JavaScript logical values to their Avro primitive representation. */
function normalizeLogicalValue(
  logicalType: string,
  value: unknown,
  schema: {type: AvroSchema; size?: number; scale?: number}
): unknown {
  if (logicalType === 'decimal') return encodeDecimal(value, schema.scale || 0, schema);
  if (logicalType === 'big-decimal') return encodeBigDecimal(value);
  if (logicalType === 'uuid') {
    const uuid = String(value ?? '');
    if (!isUuid(uuid)) throw new Error('Invalid Avro UUID value');
    return uuid;
  }
  if (logicalType === 'duration') return encodeDuration(value);
  if (value instanceof Date) {
    if (logicalType === 'date') return Math.floor(value.getTime() / 86_400_000);
    if (logicalType === 'time-millis') return getUtcTimeOfDay(value, 1_000);
    if (logicalType === 'time-micros') return getUtcTimeOfDay(value, 1_000_000);
    if (logicalType === 'timestamp-micros') return value.getTime() * 1_000;
    if (logicalType === 'timestamp-nanos' || logicalType === 'local-timestamp-nanos')
      return BigInt(value.getTime()) * 1_000_000n;
    return value.getTime();
  }
  if (typeof value === 'bigint') return value;
  return Number(value || 0);
}

/** Encodes Avro's scalable big-decimal payload as nested bytes plus a scale. */
function encodeBigDecimal(value: unknown): Uint8Array {
  const input = Array.isArray(value)
    ? {value: value[0], scale: value[1]}
    : (value as {value?: unknown; scale?: unknown} | null);
  if (!input || input.scale === undefined)
    throw new Error('Avro big-decimal requires a value and scale');
  const scale = Number(input.scale);
  if (!Number.isInteger(scale) || scale < 0)
    throw new Error('Avro big-decimal scale must be non-negative');
  const text = String(input.value ?? '0');
  const sign = text.startsWith('-') ? -1n : 1n;
  const unsignedText = text.replace(/^[+-]/, '');
  const [integerPart, fractionPart = ''] = unsignedText.split('.');
  if (fractionPart.length > scale)
    throw new Error('Avro big-decimal has too many fractional digits');
  const unscaled = sign * BigInt(`${integerPart || '0'}${fractionPart.padEnd(scale, '0')}` || '0');
  const payload = new ByteWriter();
  const bytes = encodeSignedBytes(unscaled, getMinimalDecimalByteLength(unscaled));
  payload.writeBytesValue(bytes);
  payload.writeLong(scale);
  return payload.finish();
}

/** Converts a UTC Date to an Avro time-of-day value. */
function getUtcTimeOfDay(value: Date, unit: number): number {
  return (
    ((value.getUTCHours() * 60 + value.getUTCMinutes()) * 60 + value.getUTCSeconds()) * unit +
    value.getUTCMilliseconds() * (unit / 1_000)
  );
}

/** Tests an Avro UUID string. */
function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

/** Encodes an Avro duration as months, days, and milliseconds. */
function encodeDuration(value: unknown): Uint8Array {
  const duration = Array.isArray(value)
    ? {months: value[0], days: value[1], milliseconds: value[2]}
    : (value as {months?: unknown; days?: unknown; milliseconds?: unknown} | null);
  if (!duration) throw new Error('Avro duration requires months, days, and milliseconds');
  const bytes = new Uint8Array(12);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, Number(duration.months || 0), true);
  view.setUint32(4, Number(duration.days || 0), true);
  view.setUint32(8, Number(duration.milliseconds || 0), true);
  return bytes;
}

/** Encodes a decimal value as a signed big-endian two's-complement integer. */
function encodeDecimal(
  value: unknown,
  scale: number,
  schema: {type: AvroSchema; size?: number}
): Uint8Array {
  const text = String(value ?? '0');
  const sign = text.startsWith('-') ? -1n : 1n;
  const unsignedText = text.replace(/^[+-]/, '');
  const [integerPart, fractionPart = ''] = unsignedText.split('.');
  if (fractionPart.length > scale) throw new Error('Avro decimal has too many fractional digits');
  const digits = `${integerPart || '0'}${fractionPart.padEnd(scale, '0')}`;
  const unscaled = sign * BigInt(digits || '0');
  const fixedSize = schema.type === 'fixed' ? schema.size : undefined;
  const length = fixedSize || getMinimalDecimalByteLength(unscaled);
  return encodeSignedBytes(unscaled, length);
}

/** Finds the shortest signed byte width that can contain a decimal integer. */
function getMinimalDecimalByteLength(value: bigint): number {
  for (let length = 1; length <= 32; length++) {
    const bits = BigInt(length * 8 - 1);
    if (value >= -(1n << bits) && value < 1n << bits) return length;
  }
  throw new Error('Avro decimal value is too large');
}

/** Encodes a signed integer into a fixed-width big-endian byte array. */
function encodeSignedBytes(value: bigint, length: number): Uint8Array {
  const bits = BigInt(length * 8);
  const minimum = -(1n << (bits - 1n));
  const maximum = (1n << (bits - 1n)) - 1n;
  if (value < minimum || value > maximum)
    throw new Error('Avro decimal value does not fit its schema');
  const modulo = 1n << bits;
  let encoded = value < 0n ? modulo + value : value;
  const bytes = new Uint8Array(length);
  for (let index = length - 1; index >= 0; index--) {
    bytes[index] = Number(encoded & 0xffn);
    encoded >>= 8n;
  }
  return bytes;
}

/** Writes an Avro primitive value. */
function writePrimitive(writer: ByteWriter, type: string, value: unknown): void {
  switch (type) {
    case 'null':
      return;
    case 'boolean':
      writer.writeByte(value ? 1 : 0);
      return;
    case 'int':
      writer.writeLong(Number(value || 0));
      return;
    case 'long':
      writer.writeLong(typeof value === 'bigint' ? value : Number(value || 0));
      return;
    case 'float':
      writer.writeFloat(Number(value || 0));
      return;
    case 'double':
      writer.writeDouble(Number(value || 0));
      return;
    case 'bytes':
      writer.writeBytesValue(toBytes(value));
      return;
    case 'string':
      writer.writeString(String(value ?? ''));
      return;
    default:
      throw new Error(`Unsupported Avro schema type "${type}"`);
  }
}

/** Converts an Avro bytes-compatible value to bytes. */
function toBytes(value: unknown): Uint8Array {
  if (value instanceof Uint8Array) return value;
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (Array.isArray(value)) return Uint8Array.from(value as number[]);
  throw new Error('Avro bytes and fixed values must be Uint8Array instances');
}

/** Compact byte writer for Avro's binary encoding. */
class ByteWriter {
  private readonly bytes: number[] = [];

  get length(): number {
    return this.bytes.length;
  }

  writeByte(value: number): void {
    this.bytes.push(value & 0xff);
  }

  writeBytes(bytes: Uint8Array): void {
    for (const byte of bytes) this.bytes.push(byte);
  }

  writeFixed(bytes: Uint8Array, length: number): void {
    if (bytes.length !== length) throw new Error(`Avro fixed value must contain ${length} bytes`);
    this.writeBytes(bytes);
  }

  writeBytesValue(bytes: Uint8Array): void {
    this.writeLong(bytes.length);
    this.writeBytes(bytes);
  }

  writeString(value: string): void {
    this.writeBytesValue(new TextEncoder().encode(value));
  }

  writeLong(value: number | bigint): void {
    if (typeof value === 'bigint') {
      let encoded = value < 0n ? -value * 2n - 1n : value * 2n;
      while (encoded > 0x7fn) {
        this.writeByte(Number((encoded & 0x7fn) | 0x80n));
        encoded >>= 7n;
      }
      this.writeByte(Number(encoded));
      return;
    }
    if (!Number.isSafeInteger(value))
      throw new Error(`Avro integer is outside the safe range: ${value}`);
    let encoded = value < 0 ? -value * 2 - 1 : value * 2;
    while (encoded > 0x7f) {
      this.writeByte((encoded & 0x7f) | 0x80);
      encoded = Math.floor(encoded / 128);
    }
    this.writeByte(encoded);
  }

  writeFloat(value: number): void {
    const buffer = new ArrayBuffer(4);
    new DataView(buffer).setFloat32(0, value, true);
    this.writeBytes(new Uint8Array(buffer));
  }

  writeDouble(value: number): void {
    const buffer = new ArrayBuffer(8);
    new DataView(buffer).setFloat64(0, value, true);
    this.writeBytes(new Uint8Array(buffer));
  }

  finish(): Uint8Array {
    return Uint8Array.from(this.bytes);
  }
}
