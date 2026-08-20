// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Portions adapted from hyparquet, Copyright (c) Hyperparam contributors

import type {PrimitiveType} from '../schema/declare';
import {copyUint8Array} from '../utils/binary-utils';
import {
  getParquetValueOutput,
  type CursorBuffer,
  type ParquetCodecOptions,
  type ParquetValueBuffer
} from './declare';

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
  options: ParquetCodecOptions
): ParquetValueBuffer {
  if (type !== 'INT32' && type !== 'INT64') {
    throw new Error(`DELTA_BINARY_PACKED does not support Parquet type ${type}`);
  }
  if (count === 0) {
    return getParquetValueOutput(options, 0).output;
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

  return type === 'INT32'
    ? decodeDeltaBinaryPackedInt32Values(cursor, count, miniBlockCount, valuesPerMiniBlock, options)
    : decodeDeltaBinaryPackedInt64Values(
        cursor,
        count,
        miniBlockCount,
        valuesPerMiniBlock,
        options
      );
}

/** Decodes DELTA_BINARY_PACKED INT32 values without entering the BigInt hot path. */
function decodeDeltaBinaryPackedInt32Values(
  cursor: CursorBuffer,
  count: number,
  miniBlockCount: number,
  valuesPerMiniBlock: number,
  options: ParquetCodecOptions
): ParquetValueBuffer {
  const {output, outputOffset} = getParquetValueOutput(options, count);
  let value = readZigZagVarInt32(cursor);
  let outputIndex = 0;
  output[outputOffset + outputIndex++] = value;

  while (outputIndex < count) {
    const minimumDelta = readZigZagVarInt32(cursor);
    const bitWidths = readBitWidths(cursor, miniBlockCount, 32);
    for (const bitWidth of bitWidths) {
      const packedOffset = cursor.offset;
      const packedByteLength = (valuesPerMiniBlock * bitWidth) / 8;
      assertReadable(cursor, packedByteLength);
      const valueCount = Math.min(valuesPerMiniBlock, count - outputIndex);
      value = decodeInt32MiniBlock(
        cursor.buffer,
        packedOffset,
        bitWidth,
        valueCount,
        minimumDelta,
        value,
        output,
        outputOffset + outputIndex
      );
      outputIndex += valueCount;
      cursor.offset += packedByteLength;
      if (outputIndex === count) {
        break;
      }
    }
  }

  return output;
}

/** Decodes one INT32 mini-block with an exact number-based bit reservoir. */
function decodeInt32MiniBlock(
  buffer: Uint8Array,
  packedOffset: number,
  bitWidth: number,
  count: number,
  minimumDelta: number,
  initialValue: number,
  output: ParquetValueBuffer,
  outputOffset: number
): number {
  let value = initialValue;
  if (bitWidth === 0) {
    for (let index = 0; index < count; index++) {
      value = (value + minimumDelta) | 0;
      output[outputOffset + index] = value;
    }
    return value;
  }

  const divisor = 2 ** bitWidth;
  let packedBits = 0;
  let packedBitCount = 0;
  let byteOffset = packedOffset;
  for (let index = 0; index < count; index++) {
    while (packedBitCount < bitWidth) {
      packedBits += buffer[byteOffset++] * 2 ** packedBitCount;
      packedBitCount += 8;
    }
    const packedDelta = packedBits % divisor;
    packedBits = Math.floor(packedBits / divisor);
    packedBitCount -= bitWidth;
    value = (value + minimumDelta + packedDelta) | 0;
    output[outputOffset + index] = value;
  }
  return value;
}

/** Decodes DELTA_BINARY_PACKED INT64 values with width-specialized bit reservoirs. */
function decodeDeltaBinaryPackedInt64Values(
  cursor: CursorBuffer,
  count: number,
  miniBlockCount: number,
  valuesPerMiniBlock: number,
  options: ParquetCodecOptions
): ParquetValueBuffer {
  const {output, outputOffset} = getParquetValueOutput(options, count);
  let value = readZigZagVarInt(cursor);
  let outputIndex = 0;
  writeInt64Output(output, outputOffset + outputIndex++, value, options.int64AsBigInt);

  while (outputIndex < count) {
    const minimumDelta = readZigZagVarInt(cursor);
    const bitWidths = readBitWidths(cursor, miniBlockCount, 64);
    for (const bitWidth of bitWidths) {
      const packedOffset = cursor.offset;
      const packedByteLength = (valuesPerMiniBlock * bitWidth) / 8;
      assertReadable(cursor, packedByteLength);
      const valueCount = Math.min(valuesPerMiniBlock, count - outputIndex);
      value = decodeInt64MiniBlock(
        cursor.buffer,
        packedOffset,
        bitWidth,
        valueCount,
        minimumDelta,
        value,
        output,
        outputOffset + outputIndex,
        options.int64AsBigInt
      );
      outputIndex += valueCount;
      cursor.offset += packedByteLength;
      if (outputIndex === count) {
        break;
      }
    }
  }

  return output;
}

/** Decodes one INT64 mini-block, using numbers whenever the packed value remains exact. */
function decodeInt64MiniBlock(
  buffer: Uint8Array,
  packedOffset: number,
  bitWidth: number,
  count: number,
  minimumDelta: bigint,
  initialValue: bigint,
  output: ParquetValueBuffer,
  outputOffset: number,
  int64AsBigInt: boolean | undefined
): bigint {
  let value = initialValue;
  if (bitWidth === 0) {
    for (let index = 0; index < count; index++) {
      value += minimumDelta;
      writeInt64Output(output, outputOffset + index, value, int64AsBigInt);
    }
    return value;
  }

  if (bitWidth <= 45) {
    const divisor = 2 ** bitWidth;
    let packedBits = 0;
    let packedBitCount = 0;
    let byteOffset = packedOffset;
    for (let index = 0; index < count; index++) {
      while (packedBitCount < bitWidth) {
        packedBits += buffer[byteOffset++] * 2 ** packedBitCount;
        packedBitCount += 8;
      }
      const packedDelta = packedBits % divisor;
      packedBits = Math.floor(packedBits / divisor);
      packedBitCount -= bitWidth;
      value += minimumDelta + BigInt(packedDelta);
      writeInt64Output(output, outputOffset + index, value, int64AsBigInt);
    }
    return value;
  }

  const bitWidthBigInt = BigInt(bitWidth);
  const mask = (1n << bitWidthBigInt) - 1n;
  let packedBits = 0n;
  let packedBitCount = 0;
  let byteOffset = packedOffset;
  for (let index = 0; index < count; index++) {
    while (packedBitCount < bitWidth) {
      const byteCount = Math.min(6, Math.ceil((bitWidth - packedBitCount) / 8));
      let chunk = 0;
      let multiplier = 1;
      for (let byteIndex = 0; byteIndex < byteCount; byteIndex++) {
        chunk += buffer[byteOffset++] * multiplier;
        multiplier *= 256;
      }
      packedBits |= BigInt(chunk) << BigInt(packedBitCount);
      packedBitCount += byteCount * 8;
    }
    const packedDelta = packedBits & mask;
    packedBits >>= bitWidthBigInt;
    packedBitCount -= bitWidth;
    value += minimumDelta + packedDelta;
    writeInt64Output(output, outputOffset + index, value, int64AsBigInt);
  }
  return value;
}

/** Writes one signed INT64 without a bigint-to-number round trip for Arrow destinations. */
function writeInt64Output(
  output: ParquetValueBuffer,
  outputIndex: number,
  value: bigint,
  int64AsBigInt: boolean | undefined
): void {
  (output as unknown[])[outputIndex] = int64AsBigInt
    ? BigInt.asIntN(64, value)
    : Number(BigInt.asIntN(64, value));
}

/** Decodes lengths with delta packing followed by contiguous byte-array payloads. */
export function decodeDeltaLengthByteArrayValues(
  type: PrimitiveType,
  cursor: CursorBuffer,
  count: number,
  options: ParquetCodecOptions
): ParquetValueBuffer {
  assertByteArrayType(type, 'DELTA_LENGTH_BYTE_ARRAY');
  const lengths = decodeDeltaBinaryPackedValues('INT32', cursor, count, {});
  const {output, outputOffset} = getParquetValueOutput(options, count);
  for (let index = 0; index < count; index++) {
    output[outputOffset + index] = readByteArray(cursor, Number(lengths[index]));
  }
  return output;
}

/** Decodes prefix lengths and delta-length suffixes into complete byte-array values. */
export function decodeDeltaByteArrayValues(
  type: PrimitiveType,
  cursor: CursorBuffer,
  count: number,
  options: ParquetCodecOptions
): ParquetValueBuffer {
  assertByteArrayType(type, 'DELTA_BYTE_ARRAY');
  const prefixLengths = decodeDeltaBinaryPackedValues('INT32', cursor, count, {});
  const suffixes = decodeDeltaLengthByteArrayValues(type, cursor, count, {});
  const {output, outputOffset} = getParquetValueOutput(options, count);
  let previousValue: Uint8Array | undefined;

  for (let index = 0; index < count; index++) {
    const prefixLength = Number(prefixLengths[index]);
    const suffix = suffixes[index] as Uint8Array;
    if (prefixLength < 0 || (prefixLength > 0 && prefixLength > (previousValue?.length || 0))) {
      throw new Error(`Invalid DELTA_BYTE_ARRAY prefix length ${prefixLength}`);
    }
    if (prefixLength === 0) {
      output[outputOffset + index] = suffix;
      previousValue = suffix;
      continue;
    }
    const value = new Uint8Array(prefixLength + suffix.length);
    value.set(previousValue!.subarray(0, prefixLength));
    value.set(suffix, prefixLength);
    output[outputOffset + index] = value;
    previousValue = value;
  }

  return output;
}

/** Reads and validates a sequence of one-byte mini-block bit widths. */
function readBitWidths(cursor: CursorBuffer, count: number, maximumBitWidth: number): Uint8Array {
  assertReadable(cursor, count);
  const bitWidths = cursor.buffer.subarray(cursor.offset, cursor.offset + count);
  cursor.offset += count;
  for (const bitWidth of bitWidths) {
    if (bitWidth > maximumBitWidth) {
      throw new Error('Invalid DELTA_BINARY_PACKED bit width');
    }
  }
  return bitWidths;
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
  let value = 0;
  let multiplier = 1;
  for (let byteIndex = 0; byteIndex < 10; byteIndex++) {
    assertReadable(cursor, 1);
    const byte = cursor.buffer[cursor.offset++];
    value += (byte & 0x7f) * multiplier;
    if ((byte & 0x80) === 0) {
      if (!Number.isSafeInteger(value)) {
        throw new Error('Parquet variable-length integer exceeds the safe integer range');
      }
      return value;
    }
    multiplier *= 128;
  }
  throw new Error('Invalid Parquet variable-length integer');
}

/** Reads a zig-zag encoded INT32 variable-length integer without allocating BigInts. */
function readZigZagVarInt32(cursor: CursorBuffer): number {
  const value = readUnsignedVarIntNumber(cursor);
  if (value > 0xffffffff) {
    throw new Error('Parquet INT32 variable-length integer exceeds 32 bits');
  }
  return value % 2 === 0 ? value / 2 : -(value + 1) / 2;
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
