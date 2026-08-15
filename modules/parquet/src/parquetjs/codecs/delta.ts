// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Portions adapted from hyparquet, Copyright (c) Hyperparam contributors

import type {PrimitiveType} from '../schema/declare';
import {copyUint8Array} from '../utils/binary-utils';
import type {CursorBuffer, ParquetCodecOptions} from './declare';

/** Delta encodings are currently decoder-only in loaders.gl. */
export function encodeValues(
  _type: PrimitiveType,
  _values: unknown[],
  _options: ParquetCodecOptions
): Uint8Array {
  throw new Error('Parquet delta encoding is not supported by the TypeScript writer');
}

/** Decodes one Parquet delta encoding based on its registered codec name. */
export function decodeDeltaBinaryPackedValues(
  type: PrimitiveType,
  cursor: CursorBuffer,
  count: number,
  _options: ParquetCodecOptions
): number[] {
  if (type !== 'INT32' && type !== 'INT64') {
    throw new Error(`DELTA_BINARY_PACKED does not support Parquet type ${type}`);
  }
  if (count === 0) {
    return [];
  }

  const blockSize = readUnsignedVarIntNumber(cursor);
  const miniBlockCount = readUnsignedVarIntNumber(cursor);
  const totalValueCount = readUnsignedVarIntNumber(cursor);
  if (blockSize <= 0 || miniBlockCount <= 0 || blockSize % miniBlockCount !== 0) {
    throw new Error('Invalid DELTA_BINARY_PACKED block header');
  }
  if (totalValueCount < count) {
    throw new Error(
      `DELTA_BINARY_PACKED contains ${totalValueCount} values, expected at least ${count}`
    );
  }

  const valuesPerMiniBlock = blockSize / miniBlockCount;
  if (valuesPerMiniBlock % 8 !== 0) {
    throw new Error('Invalid DELTA_BINARY_PACKED mini-block size');
  }
  let value = readZigZagVarInt(cursor);
  const values: number[] = [convertDeltaInteger(type, value)];

  while (values.length < count) {
    const minimumDelta = readZigZagVarInt(cursor);
    const bitWidths = readBitWidths(cursor, miniBlockCount);
    for (const bitWidth of bitWidths) {
      const packedOffset = cursor.offset;
      const packedByteLength = Math.ceil((valuesPerMiniBlock * bitWidth) / 8);
      assertReadable(cursor, packedByteLength);
      const valueCount = Math.min(valuesPerMiniBlock, count - values.length);
      for (let index = 0; index < valueCount; index++) {
        const packedDelta = readPackedUnsignedInteger(
          cursor.buffer,
          packedOffset,
          index * bitWidth,
          bitWidth
        );
        value += minimumDelta + packedDelta;
        values.push(convertDeltaInteger(type, value));
      }
      cursor.offset += packedByteLength;
      if (values.length === count) {
        break;
      }
    }
  }

  return values;
}

/** Converts one accumulated delta value with the physical integer type's wrapping semantics. */
function convertDeltaInteger(type: PrimitiveType, value: bigint): number {
  return Number(BigInt.asIntN(type === 'INT32' ? 32 : 64, value));
}

/** Decodes lengths with delta packing followed by contiguous byte-array payloads. */
export function decodeDeltaLengthByteArrayValues(
  type: PrimitiveType,
  cursor: CursorBuffer,
  count: number,
  options: ParquetCodecOptions
): Uint8Array[] {
  assertByteArrayType(type, 'DELTA_LENGTH_BYTE_ARRAY');
  const lengths = decodeDeltaBinaryPackedValues('INT32', cursor, count, options);
  return lengths.map(length => readByteArray(cursor, length));
}

/** Decodes prefix lengths and delta-length suffixes into complete byte-array values. */
export function decodeDeltaByteArrayValues(
  type: PrimitiveType,
  cursor: CursorBuffer,
  count: number,
  options: ParquetCodecOptions
): Uint8Array[] {
  assertByteArrayType(type, 'DELTA_BYTE_ARRAY');
  const prefixLengths = decodeDeltaBinaryPackedValues('INT32', cursor, count, options);
  const suffixes = decodeDeltaLengthByteArrayValues(type, cursor, count, options);
  const values: Uint8Array[] = [];

  for (let index = 0; index < count; index++) {
    const previousValue = values[index - 1];
    const prefixLength = prefixLengths[index];
    const suffix = suffixes[index];
    if (prefixLength < 0 || (prefixLength > 0 && prefixLength > (previousValue?.length || 0))) {
      throw new Error(`Invalid DELTA_BYTE_ARRAY prefix length ${prefixLength}`);
    }
    if (prefixLength === 0) {
      values.push(suffix);
      continue;
    }
    const value = new Uint8Array(prefixLength + suffix.length);
    value.set(previousValue.subarray(0, prefixLength));
    value.set(suffix, prefixLength);
    values.push(value);
  }

  return values;
}

/** Reads a sequence of one-byte mini-block bit widths. */
function readBitWidths(cursor: CursorBuffer, count: number): number[] {
  assertReadable(cursor, count);
  const bitWidths = Array.from(cursor.buffer.subarray(cursor.offset, cursor.offset + count));
  cursor.offset += count;
  if (bitWidths.some(bitWidth => bitWidth > 64)) {
    throw new Error('Invalid DELTA_BINARY_PACKED bit width');
  }
  return bitWidths;
}

/** Reads an unsigned little-endian bit-packed integer without changing the cursor. */
function readPackedUnsignedInteger(
  buffer: Uint8Array,
  byteOffset: number,
  bitOffset: number,
  bitWidth: number
): bigint {
  let value = 0n;
  for (let bitIndex = 0; bitIndex < bitWidth; bitIndex++) {
    const sourceBit = bitOffset + bitIndex;
    const byte = buffer[byteOffset + Math.floor(sourceBit / 8)];
    if (byte & (1 << (sourceBit % 8))) {
      value |= 1n << BigInt(bitIndex);
    }
  }
  return value;
}

/** Reads an unsigned base-128 variable-length integer. */
function readUnsignedVarInt(cursor: CursorBuffer): bigint {
  let value = 0n;
  for (let byteIndex = 0; byteIndex < 10; byteIndex++) {
    assertReadable(cursor, 1);
    const byte = cursor.buffer[cursor.offset++];
    value |= BigInt(byte & 0x7f) << BigInt(byteIndex * 7);
    if ((byte & 0x80) === 0) {
      return value;
    }
  }
  throw new Error('Invalid Parquet variable-length integer');
}

/** Reads an unsigned variable-length integer that must fit safely in a number. */
function readUnsignedVarIntNumber(cursor: CursorBuffer): number {
  const value = readUnsignedVarInt(cursor);
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error('Parquet variable-length integer exceeds the safe integer range');
  }
  return Number(value);
}

/** Reads a zig-zag encoded signed variable-length integer. */
function readZigZagVarInt(cursor: CursorBuffer): bigint {
  const value = readUnsignedVarInt(cursor);
  return (value >> 1n) ^ -(value & 1n);
}

/** Reads and copies one byte array of a validated length. */
function readByteArray(cursor: CursorBuffer, length: number): Uint8Array {
  if (!Number.isInteger(length) || length < 0) {
    throw new Error(`Invalid delta byte-array length ${length}`);
  }
  assertReadable(cursor, length);
  const value = copyUint8Array(cursor.buffer.subarray(cursor.offset, cursor.offset + length));
  cursor.offset += length;
  return value;
}

/** Restricts byte-array delta encodings to their Parquet physical types. */
function assertByteArrayType(type: PrimitiveType, encoding: string): void {
  if (type !== 'BYTE_ARRAY' && type !== 'FIXED_LEN_BYTE_ARRAY') {
    throw new Error(`${encoding} does not support Parquet type ${type}`);
  }
}

/** Ensures a codec read stays inside the current page buffer. */
function assertReadable(cursor: CursorBuffer, byteLength: number): void {
  const size = cursor.size ?? cursor.buffer.length;
  if (byteLength < 0 || cursor.offset + byteLength > size) {
    throw new Error('Unexpected end of Parquet delta-encoded data');
  }
}
