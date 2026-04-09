// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Copyright (c) 2017 ironSource Ltd.
// Forked from https://github.com/kbajalc/parquets under MIT license

/* eslint-disable camelcase */
import type {PrimitiveType} from '../schema/declare';
import type {CursorBuffer, ParquetCodecOptions} from './declare';
import {
  concatUint8Arrays,
  copyUint8Array,
  encodeUtf8,
  readDoubleLE,
  readFloatLE,
  readInt32LE,
  readInt64LE,
  readUInt32LE,
  toUint8Array,
  writeDoubleLE,
  writeFloatLE,
  writeInt32LE,
  writeInt64LE,
  writeUInt32LE
} from '../utils/binary-utils';

export function encodeValues(
  type: PrimitiveType,
  values: any[],
  opts: ParquetCodecOptions
): Uint8Array {
  switch (type) {
    case 'BOOLEAN':
      return encodeValues_BOOLEAN(values);
    case 'INT32':
      return encodeValues_INT32(values);
    case 'INT64':
      return encodeValues_INT64(values);
    case 'INT96':
      return encodeValues_INT96(values);
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
): any[] {
  switch (type) {
    case 'BOOLEAN':
      return decodeValues_BOOLEAN(cursor, count);
    case 'INT32':
      return decodeValues_INT32(cursor, count);
    case 'INT64':
      return decodeValues_INT64(cursor, count);
    case 'INT96':
      return decodeValues_INT96(cursor, count);
    case 'FLOAT':
      return decodeValues_FLOAT(cursor, count);
    case 'DOUBLE':
      return decodeValues_DOUBLE(cursor, count);
    case 'BYTE_ARRAY':
      return decodeValues_BYTE_ARRAY(cursor, count);
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

function decodeValues_BOOLEAN(cursor: CursorBuffer, count: number): boolean[] {
  const values: boolean[] = [];
  for (let i = 0; i < count; i++) {
    const b = cursor.buffer[cursor.offset + Math.floor(i / 8)];
    values.push((b & (1 << (i % 8))) > 0);
  }
  cursor.offset += Math.ceil(count / 8);
  return values;
}

function encodeValues_INT32(values: number[]): Uint8Array {
  const buf = new Uint8Array(4 * values.length);
  for (let i = 0; i < values.length; i++) {
    writeInt32LE(buf, values[i], i * 4);
  }
  return buf;
}

function decodeValues_INT32(cursor: CursorBuffer, count: number): number[] {
  const values: number[] = [];
  for (let i = 0; i < count; i++) {
    values.push(readInt32LE(cursor.buffer, cursor.offset));
    cursor.offset += 4;
  }
  return values;
}

function encodeValues_INT64(values: number[]): Uint8Array {
  const buf = new Uint8Array(8 * values.length);
  for (let i = 0; i < values.length; i++) {
    writeInt64LE(buf, values[i], i * 8);
  }
  return buf;
}

function decodeValues_INT64(cursor: CursorBuffer, count: number): number[] {
  const values: number[] = [];
  for (let i = 0; i < count; i++) {
    values.push(readInt64LE(cursor.buffer, cursor.offset));
    cursor.offset += 8;
  }
  return values;
}

function encodeValues_INT96(values: number[]): Uint8Array {
  const buf = new Uint8Array(12 * values.length);
  for (let i = 0; i < values.length; i++) {
    writeInt64LE(buf, values[i], i * 12);
    writeUInt32LE(buf, values[i] >= 0 ? 0 : 0xffffffff, i * 12 + 8);
  }
  return buf;
}

function decodeValues_INT96(cursor: CursorBuffer, count: number): number[] {
  const values: number[] = [];
  for (let i = 0; i < count; i++) {
    const low = readInt64LE(cursor.buffer, cursor.offset);
    const high = readUInt32LE(cursor.buffer, cursor.offset + 8);
    if (high === 0xffffffff) {
      values.push(~-low + 1); // truncate to 64 actual precision
    } else {
      values.push(low); // truncate to 64 actual precision
    }
    cursor.offset += 12;
  }
  return values;
}

function encodeValues_FLOAT(values: number[]): Uint8Array {
  const buf = new Uint8Array(4 * values.length);
  for (let i = 0; i < values.length; i++) {
    writeFloatLE(buf, values[i], i * 4);
  }
  return buf;
}

function decodeValues_FLOAT(cursor: CursorBuffer, count: number): number[] {
  const values: number[] = [];
  for (let i = 0; i < count; i++) {
    values.push(readFloatLE(cursor.buffer, cursor.offset));
    cursor.offset += 4;
  }
  return values;
}

function encodeValues_DOUBLE(values: number[]): Uint8Array {
  const buf = new Uint8Array(8 * values.length);
  for (let i = 0; i < values.length; i++) {
    writeDoubleLE(buf, values[i], i * 8);
  }
  return buf;
}

function decodeValues_DOUBLE(cursor: CursorBuffer, count: number): number[] {
  const values: number[] = [];
  for (let i = 0; i < count; i++) {
    values.push(readDoubleLE(cursor.buffer, cursor.offset));
    cursor.offset += 8;
  }
  return values;
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

function decodeValues_BYTE_ARRAY(cursor: CursorBuffer, count: number): Uint8Array[] {
  const values: Uint8Array[] = [];
  for (let i = 0; i < count; i++) {
    const len = readUInt32LE(cursor.buffer, cursor.offset);
    cursor.offset += 4;
    values.push(copyUint8Array(cursor.buffer.subarray(cursor.offset, cursor.offset + len)));
    cursor.offset += len;
  }
  return values;
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
): Uint8Array[] {
  const values: Uint8Array[] = [];
  if (!opts.typeLength) {
    throw new Error('missing option: typeLength (required for FIXED_LEN_BYTE_ARRAY)');
  }
  for (let i = 0; i < count; i++) {
    values.push(
      copyUint8Array(cursor.buffer.subarray(cursor.offset, cursor.offset + opts.typeLength))
    );
    cursor.offset += opts.typeLength;
  }
  return values;
}

function toPrimitiveBytes(value: any): Uint8Array {
  return typeof value === 'string' ? encodeUtf8(value) : toUint8Array(value);
}
