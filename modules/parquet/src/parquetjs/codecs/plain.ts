// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Copyright (c) 2017 ironSource Ltd.
// Forked from https://github.com/kbajalc/parquets under MIT license

/* eslint-disable camelcase */
import type {PrimitiveType} from '../schema/declare';
import {
  getParquetValueOutput,
  reserveParquetByteArrayOutput,
  type CursorBuffer,
  type ParquetCodecOptions,
  type ParquetValueBuffer
} from './declare';
import {
  concatUint8Arrays,
  copyUint8Array,
  encodeUtf8,
  toUint8Array,
  writeDoubleLE,
  writeFloatLE,
  writeInt32LE,
  writeInt64LE,
  writeUInt32LE
} from '../utils/binary-utils';

const JULIAN_DAY_UNIX_EPOCH = 2440588n;
const NANOSECONDS_PER_DAY = 86_400_000_000_000n;
const INT64_MIN = -(1n << 63n);
const INT64_MAX = (1n << 63n) - 1n;
const IS_LITTLE_ENDIAN = new Uint8Array(new Uint16Array([1]).buffer)[0] === 1;
/** Largest byte value copied inline to avoid a temporary TypedArray view. */
const MAXIMUM_INLINE_BYTE_COPY_LENGTH = 7;

export function encodeValues(
  type: PrimitiveType,
  values: any[],
  opts: ParquetCodecOptions = {}
): Uint8Array {
  switch (type) {
    case 'BOOLEAN':
      return encodeValues_BOOLEAN(values);
    case 'INT32':
      return encodeValues_INT32(values);
    case 'INT64':
      return encodeValues_INT64(values);
    case 'INT96':
      return encodeValues_INT96(values, opts.int96AsTimestamp);
    case 'FLOAT':
      return encodeValues_FLOAT(values);
    case 'DOUBLE':
      return encodeValues_DOUBLE(values);
    case 'BYTE_ARRAY':
      return encodeValues_BYTE_ARRAY(values);
    case 'FIXED_LEN_BYTE_ARRAY':
      return encodeValues_FIXED_LEN_BYTE_ARRAY(values, opts);
    default:
      throw new Error(`unsupported type: ${type}`);
  }
}

export function decodeValues(
  type: PrimitiveType,
  cursor: CursorBuffer,
  count: number,
  opts: ParquetCodecOptions
): ParquetValueBuffer {
  switch (type) {
    case 'BOOLEAN':
      return decodeValues_BOOLEAN(cursor, count, opts);
    case 'INT32':
      return decodeValues_INT32(cursor, count, opts);
    case 'INT64':
      return decodeValues_INT64(cursor, count, opts);
    case 'INT96':
      return decodeValues_INT96(cursor, count, opts);
    case 'FLOAT':
      return decodeValues_FLOAT(cursor, count, opts);
    case 'DOUBLE':
      return decodeValues_DOUBLE(cursor, count, opts);
    case 'BYTE_ARRAY':
      return decodeValues_BYTE_ARRAY(cursor, count, opts);
    case 'FIXED_LEN_BYTE_ARRAY':
      return decodeValues_FIXED_LEN_BYTE_ARRAY(cursor, count, opts);
    default:
      throw new Error(`unsupported type: ${type}`);
  }
}

function encodeValues_BOOLEAN(values: boolean[]): Uint8Array {
  const buf = new Uint8Array(Math.ceil(values.length / 8));
  for (let i = 0; i < values.length; i++) {
    if (values[i]) {
      buf[Math.floor(i / 8)] |= 1 << (i % 8);
    }
  }
  return buf;
}

function decodeValues_BOOLEAN(
  cursor: CursorBuffer,
  count: number,
  options: ParquetCodecOptions
): ParquetValueBuffer {
  const {output, outputOffset} = getParquetValueOutput(options, count);
  for (let i = 0; i < count; i++) {
    const b = cursor.buffer[cursor.offset + Math.floor(i / 8)];
    const value = (b & (1 << (i % 8))) > 0;
    output[outputOffset + i] = output instanceof Uint8Array ? Number(value) : value;
  }
  cursor.offset += Math.ceil(count / 8);
  return output;
}

function encodeValues_INT32(values: number[]): Uint8Array {
  const buf = new Uint8Array(4 * values.length);
  for (let i = 0; i < values.length; i++) {
    writeInt32LE(buf, values[i], i * 4);
  }
  return buf;
}

function decodeValues_INT32(
  cursor: CursorBuffer,
  count: number,
  options: ParquetCodecOptions
): ParquetValueBuffer {
  const {output, outputOffset} = getParquetValueOutput(options, count);
  if (output instanceof Int32Array && copyPlainTypedValues(cursor, output, outputOffset, count)) {
    return output;
  }
  const dataView = getCursorDataView(cursor);
  for (let i = 0; i < count; i++) {
    output[outputOffset + i] = dataView.getInt32(cursor.offset, true);
    cursor.offset += 4;
  }
  return output;
}

function encodeValues_INT64(values: Array<number | bigint>): Uint8Array {
  const buf = new Uint8Array(8 * values.length);
  for (let i = 0; i < values.length; i++) {
    writeInt64LE(buf, values[i], i * 8);
  }
  return buf;
}

function decodeValues_INT64(
  cursor: CursorBuffer,
  count: number,
  options: ParquetCodecOptions
): ParquetValueBuffer {
  const {output, outputOffset} = getParquetValueOutput(options, count);
  if (
    options.int64AsBigInt &&
    output instanceof BigInt64Array &&
    copyPlainTypedValues(cursor, output, outputOffset, count)
  ) {
    return output;
  }
  const dataView = getCursorDataView(cursor);
  for (let i = 0; i < count; i++) {
    const value = dataView.getBigInt64(cursor.offset, true);
    output[outputOffset + i] = options.int64AsBigInt ? value : Number(value);
    cursor.offset += 8;
  }
  return output;
}

function encodeValues_INT96(values: Array<number | bigint>, asTimestamp = false): Uint8Array {
  const buf = new Uint8Array(12 * values.length);
  for (let i = 0; i < values.length; i++) {
    if (!asTimestamp) {
      writeInt64LE(buf, values[i], i * 12);
      writeUInt32LE(buf, values[i] >= 0 ? 0 : 0xffffffff, i * 12 + 8);
      continue;
    }
    const epochNanoseconds = BigInt(values[i]);
    if (epochNanoseconds < INT64_MIN || epochNanoseconds > INT64_MAX) {
      throw new Error(`INT96 timestamp is outside the signed 64-bit range: ${epochNanoseconds}`);
    }
    const julianDayOffset = floorDivide(epochNanoseconds, NANOSECONDS_PER_DAY);
    const nanosecondsOfDay = epochNanoseconds - julianDayOffset * NANOSECONDS_PER_DAY;
    const julianDay = JULIAN_DAY_UNIX_EPOCH + julianDayOffset;
    if (julianDay < -2147483648n || julianDay > 2147483647n) {
      throw new Error(`INT96 timestamp has an unsupported Julian day: ${julianDay}`);
    }
    writeInt64LE(buf, nanosecondsOfDay, i * 12);
    writeInt32LE(buf, Number(julianDay), i * 12 + 8);
  }
  return buf;
}

function floorDivide(value: bigint, divisor: bigint): bigint {
  const quotient = value / divisor;
  const remainder = value % divisor;
  return remainder < 0n ? quotient - 1n : quotient;
}

function decodeValues_INT96(
  cursor: CursorBuffer,
  count: number,
  options: ParquetCodecOptions
): ParquetValueBuffer {
  const {output, outputOffset} = getParquetValueOutput(options, count);
  const dataView = getCursorDataView(cursor);
  for (let i = 0; i < count; i++) {
    if (options.int96AsTimestamp) {
      const nanosecondsOfDay = dataView.getBigUint64(cursor.offset, true);
      if (nanosecondsOfDay >= NANOSECONDS_PER_DAY) {
        throw new Error(`Invalid INT96 nanoseconds of day: ${nanosecondsOfDay}`);
      }
      const julianDay = BigInt(dataView.getInt32(cursor.offset + 8, true));
      const epochNanoseconds =
        (julianDay - JULIAN_DAY_UNIX_EPOCH) * NANOSECONDS_PER_DAY + nanosecondsOfDay;
      if (epochNanoseconds < INT64_MIN || epochNanoseconds > INT64_MAX) {
        throw new Error(`INT96 timestamp is outside the signed 64-bit range: ${epochNanoseconds}`);
      }
      output[outputOffset + i] = epochNanoseconds;
    } else {
      const low = Number(dataView.getBigInt64(cursor.offset, true));
      const high = dataView.getUint32(cursor.offset + 8, true);
      if (high === 0xffffffff) {
        output[outputOffset + i] = ~-low + 1; // truncate to 64 actual precision
      } else {
        output[outputOffset + i] = low; // truncate to 64 actual precision
      }
    }
    cursor.offset += 12;
  }
  return output;
}

function encodeValues_FLOAT(values: number[]): Uint8Array {
  const buf = new Uint8Array(4 * values.length);
  for (let i = 0; i < values.length; i++) {
    writeFloatLE(buf, values[i], i * 4);
  }
  return buf;
}

function decodeValues_FLOAT(
  cursor: CursorBuffer,
  count: number,
  options: ParquetCodecOptions
): ParquetValueBuffer {
  const {output, outputOffset} = getParquetValueOutput(options, count);
  if (output instanceof Float32Array && copyPlainTypedValues(cursor, output, outputOffset, count)) {
    return output;
  }
  const dataView = getCursorDataView(cursor);
  for (let i = 0; i < count; i++) {
    output[outputOffset + i] = dataView.getFloat32(cursor.offset, true);
    cursor.offset += 4;
  }
  return output;
}

function encodeValues_DOUBLE(values: number[]): Uint8Array {
  const buf = new Uint8Array(8 * values.length);
  for (let i = 0; i < values.length; i++) {
    writeDoubleLE(buf, values[i], i * 8);
  }
  return buf;
}

function decodeValues_DOUBLE(
  cursor: CursorBuffer,
  count: number,
  options: ParquetCodecOptions
): ParquetValueBuffer {
  const {output, outputOffset} = getParquetValueOutput(options, count);
  if (output instanceof Float64Array && copyPlainTypedValues(cursor, output, outputOffset, count)) {
    return output;
  }
  const dataView = getCursorDataView(cursor);
  for (let i = 0; i < count; i++) {
    output[outputOffset + i] = dataView.getFloat64(cursor.offset, true);
    cursor.offset += 8;
  }
  return output;
}

function encodeValues_BYTE_ARRAY(values: any[]): Uint8Array {
  const byteValues = values.map(toPrimitiveBytes);
  // tslint:disable-next-line:variable-name
  let buf_len = 0;
  for (let i = 0; i < byteValues.length; i++) {
    buf_len += 4 + byteValues[i].length;
  }
  const buf = new Uint8Array(buf_len);
  // tslint:disable-next-line:variable-name
  let buf_pos = 0;
  for (let i = 0; i < byteValues.length; i++) {
    writeUInt32LE(buf, byteValues[i].length, buf_pos);
    buf.set(byteValues[i], buf_pos + 4);
    buf_pos += 4 + byteValues[i].length;
  }
  return buf;
}

function decodeValues_BYTE_ARRAY(
  cursor: CursorBuffer,
  count: number,
  options: ParquetCodecOptions
): ParquetValueBuffer {
  if (options.byteArrayOutput) {
    return decodeByteArraysToContiguousOutput(cursor, count, options);
  }
  const {output, outputOffset} = getParquetValueOutput(options, count);
  const dataView = getCursorDataView(cursor);
  for (let i = 0; i < count; i++) {
    const len = dataView.getUint32(cursor.offset, true);
    cursor.offset += 4;
    output[outputOffset + i] = readByteArray(cursor, len, options.retainByteArrayViews);
  }
  return output;
}

/** Decodes length-prefixed PLAIN values directly into one Arrow-compatible byte buffer. */
function decodeByteArraysToContiguousOutput(
  cursor: CursorBuffer,
  count: number,
  options: ParquetCodecOptions
): ParquetValueBuffer {
  const byteArrayOutput = options.byteArrayOutput!;
  const outputOffset = options.outputOffset || 0;
  const dataView = getCursorDataView(cursor);
  let byteOffset = byteArrayOutput.byteLength;
  byteArrayOutput.valueOffsets[outputOffset] = byteOffset;
  const remainingByteLength = (cursor.size ?? cursor.buffer.byteLength) - cursor.offset;
  if (remainingByteLength < 0) {
    throw new Error('PLAIN BYTE_ARRAY cursor exceeds the page buffer');
  }
  // PLAIN's remaining encoded bytes are an upper bound for its decoded payload because each value
  // drops a four-byte length prefix. Reserve once per page instead of checking capacity per value.
  reserveParquetByteArrayOutput(byteArrayOutput, remainingByteLength);
  for (let valueIndex = 0; valueIndex < count; valueIndex++) {
    const byteLength = dataView.getUint32(cursor.offset, true);
    cursor.offset += 4;
    const sourceEnd = cursor.offset + byteLength;
    const destinationEnd = byteOffset + byteLength;
    if (sourceEnd > (cursor.size ?? cursor.buffer.byteLength)) {
      throw new Error('PLAIN BYTE_ARRAY value exceeds the page buffer');
    }
    if (byteLength <= MAXIMUM_INLINE_BYTE_COPY_LENGTH) {
      for (let byteIndex = 0; byteIndex < byteLength; byteIndex++) {
        byteArrayOutput.data[byteOffset + byteIndex] = cursor.buffer[cursor.offset + byteIndex];
      }
    } else {
      byteArrayOutput.data.set(cursor.buffer.subarray(cursor.offset, sourceEnd), byteOffset);
    }
    cursor.offset = sourceEnd;
    byteOffset = destinationEnd;
    byteArrayOutput.valueOffsets[outputOffset + valueIndex + 1] = byteOffset;
  }
  byteArrayOutput.byteLength = byteOffset;
  return options.output || [];
}

function encodeValues_FIXED_LEN_BYTE_ARRAY(values: any[], opts: ParquetCodecOptions): Uint8Array {
  if (!opts.typeLength) {
    throw new Error('missing option: typeLength (required for FIXED_LEN_BYTE_ARRAY)');
  }
  const byteValues = values.map(toPrimitiveBytes);
  for (let i = 0; i < values.length; i++) {
    if (byteValues[i].length !== opts.typeLength) {
      throw new Error(`invalid value for FIXED_LEN_BYTE_ARRAY: ${values[i]}`);
    }
  }
  return concatUint8Arrays(byteValues);
}

function decodeValues_FIXED_LEN_BYTE_ARRAY(
  cursor: CursorBuffer,
  count: number,
  opts: ParquetCodecOptions
): ParquetValueBuffer {
  if (!opts.typeLength) {
    throw new Error('missing option: typeLength (required for FIXED_LEN_BYTE_ARRAY)');
  }
  if (opts.byteArrayOutput) {
    return decodeFixedLengthByteArraysToContiguousOutput(cursor, count, opts.typeLength, opts);
  }
  const {output, outputOffset} = getParquetValueOutput(opts, count);
  for (let i = 0; i < count; i++) {
    output[outputOffset + i] = readByteArray(cursor, opts.typeLength, opts.retainByteArrayViews);
  }
  return output;
}

/** Exposes one fixed-width PLAIN payload directly as Arrow-compatible bytes and offsets. */
function decodeFixedLengthByteArraysToContiguousOutput(
  cursor: CursorBuffer,
  count: number,
  typeLength: number,
  options: ParquetCodecOptions
): ParquetValueBuffer {
  const byteArrayOutput = options.byteArrayOutput!;
  const outputOffset = options.outputOffset || 0;
  const payloadByteLength = count * typeLength;
  const inputEnd = cursor.offset + payloadByteLength;
  if (inputEnd > (cursor.size ?? cursor.buffer.byteLength)) {
    throw new Error('PLAIN FIXED_LEN_BYTE_ARRAY values exceed the page buffer');
  }

  let byteOffset = byteArrayOutput.byteLength;
  byteArrayOutput.valueOffsets[outputOffset] = byteOffset;
  if (byteOffset === 0) {
    // The common single-page case can retain the original Parquet bytes without allocating either
    // one view per value or a second payload buffer. A later page falls back to append-and-copy.
    byteArrayOutput.data = cursor.buffer.subarray(cursor.offset, inputEnd);
  } else {
    reserveParquetByteArrayOutput(byteArrayOutput, payloadByteLength);
    byteArrayOutput.data.set(cursor.buffer.subarray(cursor.offset, inputEnd), byteOffset);
  }
  cursor.offset = inputEnd;
  for (let valueIndex = 0; valueIndex < count; valueIndex++) {
    byteOffset += typeLength;
    byteArrayOutput.valueOffsets[outputOffset + valueIndex + 1] = byteOffset;
  }
  byteArrayOutput.byteLength = byteOffset;
  return options.output || [];
}

/** Reads one byte-array value, optionally retaining a view into the decoded page buffer. */
function readByteArray(
  cursor: CursorBuffer,
  byteLength: number,
  retainByteArrayView: boolean | undefined
): Uint8Array {
  const value = cursor.buffer.subarray(cursor.offset, cursor.offset + byteLength);
  cursor.offset += byteLength;
  return retainByteArrayView ? value : copyUint8Array(value);
}

/** Creates one reusable DataView for all primitive reads from a codec cursor. */
function getCursorDataView(cursor: CursorBuffer): DataView {
  return new DataView(cursor.buffer.buffer, cursor.buffer.byteOffset, cursor.buffer.byteLength);
}

/** Copies little-endian PLAIN values directly into an identical typed destination. */
function copyPlainTypedValues(
  cursor: CursorBuffer,
  output: Int32Array | BigInt64Array | Float32Array | Float64Array,
  outputOffset: number,
  count: number
): boolean {
  if (!IS_LITTLE_ENDIAN) {
    return false;
  }
  const byteLength = count * output.BYTES_PER_ELEMENT;
  const inputEnd = cursor.offset + byteLength;
  if (inputEnd > (cursor.size ?? cursor.buffer.length) || outputOffset + count > output.length) {
    throw new Error('Unexpected end of Parquet PLAIN values');
  }
  const outputBytes = new Uint8Array(
    output.buffer,
    output.byteOffset + outputOffset * output.BYTES_PER_ELEMENT,
    byteLength
  );
  outputBytes.set(cursor.buffer.subarray(cursor.offset, inputEnd));
  cursor.offset = inputEnd;
  return true;
}

function toPrimitiveBytes(value: any): Uint8Array {
  return typeof value === 'string' ? encodeUtf8(value) : toUint8Array(value);
}
