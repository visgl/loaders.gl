// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Portions adapted from hyparquet, Copyright (c) Hyperparam contributors

import type {PrimitiveType} from '../schema/declare';
import {concatUint8Arrays, copyUint8Array, toUint8Array} from '../utils/binary-utils';
import {
  getParquetValueOutput,
  reserveParquetByteArrayOutput,
  type CursorBuffer,
  type ParquetCodecOptions,
  type ParquetValueBuffer
} from './declare';

const DELTA_BLOCK_SIZE = 128;
const DELTA_MINI_BLOCK_COUNT = 4;
const DELTA_VALUES_PER_MINI_BLOCK = DELTA_BLOCK_SIZE / DELTA_MINI_BLOCK_COUNT;
const UINT32_BASE = 0x1_0000_0000;
const IS_LITTLE_ENDIAN = new Uint8Array(new Uint16Array([1]).buffer)[0] === 1;

/** Encodes INT32 or INT64 values using Parquet DELTA_BINARY_PACKED. */
export function encodeDeltaBinaryPackedValues(
  type: PrimitiveType,
  values: unknown[],
  _options: ParquetCodecOptions
): Uint8Array {
  if (type !== 'INT32' && type !== 'INT64') {
    throw new Error(`DELTA_BINARY_PACKED does not support Parquet type ${type}`);
  }
  if (values.length === 0) {
    return new Uint8Array(0);
  }

  const integerValues = values.map(value => getSignedInteger(type, value));
  const output: Uint8Array[] = [
    encodeUnsignedVarInt(BigInt(DELTA_BLOCK_SIZE)),
    encodeUnsignedVarInt(BigInt(DELTA_MINI_BLOCK_COUNT)),
    encodeUnsignedVarInt(BigInt(integerValues.length)),
    encodeZigZagVarInt(integerValues[0])
  ];

  const deltas: bigint[] = [];
  for (let valueIndex = 1; valueIndex < integerValues.length; valueIndex++) {
    const delta = integerValues[valueIndex] - integerValues[valueIndex - 1];
    deltas.push(type === 'INT32' ? BigInt.asIntN(32, delta) : BigInt.asIntN(64, delta));
  }

  for (let blockOffset = 0; blockOffset < deltas.length; blockOffset += DELTA_BLOCK_SIZE) {
    const block = deltas.slice(blockOffset, blockOffset + DELTA_BLOCK_SIZE);
    const minimumDelta = block.reduce(
      (minimum, delta) => (delta < minimum ? delta : minimum),
      block[0]
    );
    output.push(encodeZigZagVarInt(minimumDelta));

    const miniBlocks: bigint[][] = [];
    const bitWidths = new Uint8Array(DELTA_MINI_BLOCK_COUNT);
    for (let miniBlockIndex = 0; miniBlockIndex < DELTA_MINI_BLOCK_COUNT; miniBlockIndex++) {
      const miniBlockOffset = miniBlockIndex * DELTA_VALUES_PER_MINI_BLOCK;
      const adjustedDeltas = block
        .slice(miniBlockOffset, miniBlockOffset + DELTA_VALUES_PER_MINI_BLOCK)
        .map(delta => delta - minimumDelta);
      while (adjustedDeltas.length < DELTA_VALUES_PER_MINI_BLOCK) {
        adjustedDeltas.push(0n);
      }
      miniBlocks.push(adjustedDeltas);
      bitWidths[miniBlockIndex] = adjustedDeltas.reduce(
        (bitWidth, delta) => Math.max(bitWidth, getUnsignedBitWidth(delta)),
        0
      );
    }
    output.push(bitWidths);
    for (let miniBlockIndex = 0; miniBlockIndex < DELTA_MINI_BLOCK_COUNT; miniBlockIndex++) {
      output.push(packUnsignedValues(miniBlocks[miniBlockIndex], bitWidths[miniBlockIndex]));
    }
  }
  return concatUint8Arrays(output);
}

/** Encodes BYTE_ARRAY values as delta-packed lengths followed by their contiguous payloads. */
export function encodeDeltaLengthByteArrayValues(
  type: PrimitiveType,
  values: unknown[],
  _options: ParquetCodecOptions
): Uint8Array {
  if (type !== 'BYTE_ARRAY') {
    throw new Error(`DELTA_LENGTH_BYTE_ARRAY does not support Parquet type ${type}`);
  }
  const byteArrays = values.map(value => toUint8Array(value as ArrayBuffer | ArrayBufferView));
  const encodedLengths = encodeDeltaBinaryPackedValues(
    'INT32',
    byteArrays.map(value => value.byteLength),
    {}
  );
  return concatUint8Arrays([encodedLengths, ...byteArrays]);
}

/** Encodes byte arrays as delta-packed prefix lengths and delta-length suffixes. */
export function encodeDeltaByteArrayValues(
  type: PrimitiveType,
  values: unknown[],
  _options: ParquetCodecOptions
): Uint8Array {
  assertByteArrayType(type, 'DELTA_BYTE_ARRAY');
  const byteArrays = values.map(value => toUint8Array(value as ArrayBuffer | ArrayBufferView));
  const prefixLengths: number[] = [];
  const suffixes: Uint8Array[] = [];
  let previousValue: Uint8Array = new Uint8Array(0);
  for (const value of byteArrays) {
    const prefixLength = getCommonPrefixLength(previousValue, value);
    prefixLengths.push(prefixLength);
    suffixes.push(value.subarray(prefixLength));
    previousValue = value;
  }
  return concatUint8Arrays([
    encodeDeltaBinaryPackedValues('INT32', prefixLengths, {}),
    encodeDeltaLengthByteArrayValues('BYTE_ARRAY', suffixes, {})
  ]);
}

/** Returns whether an encoding is valid for a physical Parquet type. */
export function isDeltaEncodingType(encoding: string, type: PrimitiveType): boolean {
  switch (encoding) {
    case 'DELTA_BINARY_PACKED':
      return type === 'INT32' || type === 'INT64';
    case 'DELTA_LENGTH_BYTE_ARRAY':
      return type === 'BYTE_ARRAY';
    case 'DELTA_BYTE_ARRAY':
      return type === 'BYTE_ARRAY' || type === 'FIXED_LEN_BYTE_ARRAY';
    default:
      return false;
  }
}

/** Converts one writer value to its exact signed physical integer. */
function getSignedInteger(type: 'INT32' | 'INT64', value: unknown): bigint {
  let integerValue: bigint;
  try {
    integerValue = BigInt(value as bigint | boolean | number | string);
  } catch {
    throw new Error(`Invalid ${type} value ${value}`);
  }
  const bitWidth = type === 'INT32' ? 32 : 64;
  if (integerValue !== BigInt.asIntN(bitWidth, integerValue)) {
    throw new Error(`${type} value ${value} is out of range`);
  }
  return integerValue;
}

/** Encodes a non-negative integer as an unsigned base-128 variable integer. */
function encodeUnsignedVarInt(value: bigint): Uint8Array {
  if (value < 0n) {
    throw new Error(`Cannot encode negative unsigned variable integer ${value}`);
  }
  const bytes: number[] = [];
  let remainingValue = value;
  do {
    const byte = Number(remainingValue & 0x7fn);
    remainingValue >>= 7n;
    bytes.push(remainingValue === 0n ? byte : byte | 0x80);
  } while (remainingValue !== 0n);
  return Uint8Array.from(bytes);
}

/** Encodes a signed integer using zig-zag base-128 variable integer representation. */
function encodeZigZagVarInt(value: bigint): Uint8Array {
  const zigZagValue = value >= 0n ? value * 2n : -value * 2n - 1n;
  return encodeUnsignedVarInt(zigZagValue);
}

/** Returns the minimum unsigned bit width needed for a non-negative integer. */
function getUnsignedBitWidth(value: bigint): number {
  if (value < 0n) {
    throw new Error(`Cannot bit-pack negative value ${value}`);
  }
  return value === 0n ? 0 : value.toString(2).length;
}

/** Bit-packs unsigned values least-significant bit first as required by Parquet. */
function packUnsignedValues(values: bigint[], bitWidth: number): Uint8Array {
  if (bitWidth === 0) {
    return new Uint8Array(0);
  }
  const output = new Uint8Array((values.length * bitWidth) / 8);
  const mask = (1n << BigInt(bitWidth)) - 1n;
  let packedBits = 0n;
  let packedBitCount = 0;
  let outputOffset = 0;
  for (const value of values) {
    packedBits |= (value & mask) << BigInt(packedBitCount);
    packedBitCount += bitWidth;
    while (packedBitCount >= 8) {
      output[outputOffset++] = Number(packedBits & 0xffn);
      packedBits >>= 8n;
      packedBitCount -= 8;
    }
  }
  return output;
}

/** Returns the common leading byte count of two byte arrays. */
function getCommonPrefixLength(left: Uint8Array, right: Uint8Array): number {
  const maximumLength = Math.min(left.length, right.length);
  let prefixLength = 0;
  while (prefixLength < maximumLength && left[prefixLength] === right[prefixLength]) {
    prefixLength++;
  }
  return prefixLength;
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
    const activeMiniBlockCount = Math.min(
      miniBlockCount,
      Math.ceil((count - outputIndex) / valuesPerMiniBlock)
    );
    // Writers commonly select one width for every mini-block in a block. Fuse that contiguous
    // bitstream so the decoder pays call/state setup once instead of once per 32 values.
    if (haveEqualBitWidths(bitWidths, activeMiniBlockCount)) {
      const bitWidth = bitWidths[0];
      const valueCount = Math.min(valuesPerMiniBlock * activeMiniBlockCount, count - outputIndex);
      const packedByteLength = (valuesPerMiniBlock * activeMiniBlockCount * bitWidth) / 8;
      assertReadable(cursor, packedByteLength);
      value = decodeInt32MiniBlock(
        cursor.buffer,
        cursor.offset,
        bitWidth,
        valueCount,
        minimumDelta,
        value,
        output,
        outputOffset + outputIndex
      );
      outputIndex += valueCount;
      cursor.offset += packedByteLength;
      continue;
    }
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

  if (bitWidth <= 24) {
    // Bitwise reservoirs stay exact through 24 bits and are substantially cheaper than the
    // division-based reservoir required for wider INT32 deltas.
    const mask = 2 ** bitWidth - 1;
    let packedBits = 0;
    let packedBitCount = 0;
    let byteOffset = packedOffset;
    for (let index = 0; index < count; index++) {
      while (packedBitCount < bitWidth) {
        packedBits |= buffer[byteOffset++] << packedBitCount;
        packedBitCount += 8;
      }
      value = (value + minimumDelta + (packedBits & mask)) | 0;
      output[outputOffset + index] = value;
      packedBits >>>= bitWidth;
      packedBitCount -= bitWidth;
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
  if (options.int64AsBigInt && output instanceof BigInt64Array) {
    // BigInt arithmetic per value is expensive in V8. Decode into the two uint32 words backing
    // Arrow Int64 instead; modulo-64 addition preserves every signed INT64 bit pattern exactly.
    const state = new Uint32Array(2);
    readZigZagVarIntWords(cursor, state);
    return decodeDeltaBinaryPackedInt64ArrowValues(
      cursor,
      count,
      miniBlockCount,
      valuesPerMiniBlock,
      output,
      outputOffset,
      state
    );
  }
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

/** Decodes INT64 directly into Arrow storage with modulo-64 two-word arithmetic. */
function decodeDeltaBinaryPackedInt64ArrowValues(
  cursor: CursorBuffer,
  count: number,
  miniBlockCount: number,
  valuesPerMiniBlock: number,
  output: BigInt64Array,
  outputOffset: number,
  state: Uint32Array
): BigInt64Array {
  const outputWords = new Uint32Array(output.buffer, output.byteOffset, output.length * 2);
  const minimumDeltaWords = new Uint32Array(2);
  let outputIndex = 0;
  writeInt64Words(outputWords, outputOffset + outputIndex++, state[0], state[1]);

  while (outputIndex < count) {
    readZigZagVarIntWords(cursor, minimumDeltaWords);
    const bitWidths = readBitWidths(cursor, miniBlockCount, 64);
    const activeMiniBlockCount = Math.min(
      miniBlockCount,
      Math.ceil((count - outputIndex) / valuesPerMiniBlock)
    );
    // Preserve the equal-width fusion used by the wide-column benchmark. Splitting this back into
    // four mini-block calls repeats state loads/stores and loses measurable throughput.
    if (haveEqualBitWidths(bitWidths, activeMiniBlockCount)) {
      const bitWidth = bitWidths[0];
      const valueCount = Math.min(valuesPerMiniBlock * activeMiniBlockCount, count - outputIndex);
      const packedByteLength = (valuesPerMiniBlock * activeMiniBlockCount * bitWidth) / 8;
      assertReadable(cursor, packedByteLength);
      decodeInt64ArrowMiniBlock(
        cursor.buffer,
        cursor.offset,
        bitWidth,
        valueCount,
        minimumDeltaWords[0],
        minimumDeltaWords[1],
        state,
        outputWords,
        outputOffset + outputIndex
      );
      outputIndex += valueCount;
      cursor.offset += packedByteLength;
      continue;
    }
    for (const bitWidth of bitWidths) {
      const packedOffset = cursor.offset;
      const packedByteLength = (valuesPerMiniBlock * bitWidth) / 8;
      assertReadable(cursor, packedByteLength);
      const valueCount = Math.min(valuesPerMiniBlock, count - outputIndex);
      decodeInt64ArrowMiniBlock(
        cursor.buffer,
        packedOffset,
        bitWidth,
        valueCount,
        minimumDeltaWords[0],
        minimumDeltaWords[1],
        state,
        outputWords,
        outputOffset + outputIndex
      );
      outputIndex += valueCount;
      cursor.offset += packedByteLength;
      if (outputIndex === count) break;
    }
  }
  return output;
}

/** Returns whether all mini-blocks in one DELTA_BINARY_PACKED block use one bit width. */
function haveEqualBitWidths(bitWidths: Uint8Array, count: number): boolean {
  const firstBitWidth = bitWidths[0];
  for (let index = 1; index < count; index++) {
    if (bitWidths[index] !== firstBitWidth) return false;
  }
  return true;
}

/** Decodes one INT64 mini-block directly into the two 32-bit words backing Arrow Int64. */
function decodeInt64ArrowMiniBlock(
  buffer: Uint8Array,
  packedOffset: number,
  bitWidth: number,
  count: number,
  minimumDeltaLow: number,
  minimumDeltaHigh: number,
  state: Uint32Array,
  outputWords: Uint32Array,
  outputOffset: number
): void {
  let stateLow = state[0];
  let stateHigh = state[1];
  const lowWordOffset = IS_LITTLE_ENDIAN ? 0 : 1;
  const highWordOffset = IS_LITTLE_ENDIAN ? 1 : 0;

  if (bitWidth === 0) {
    for (let index = 0; index < count; index++) {
      const lowSum = stateLow + minimumDeltaLow;
      stateLow = lowSum >>> 0;
      // V8 strength-reduces division by this constant; explicit carry branches benchmark slower.
      stateHigh = (stateHigh + minimumDeltaHigh + Math.floor(lowSum / UINT32_BASE)) >>> 0;
      const wordOffset = (outputOffset + index) * 2;
      outputWords[wordOffset + lowWordOffset] = stateLow;
      outputWords[wordOffset + highWordOffset] = stateHigh;
    }
    state[0] = stateLow;
    state[1] = stateHigh;
    return;
  }

  if (bitWidth <= 24) {
    decodeNarrowInt64ArrowMiniBlock(
      buffer,
      packedOffset,
      bitWidth,
      count,
      minimumDeltaLow,
      minimumDeltaHigh,
      state,
      outputWords,
      outputOffset
    );
    return;
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
      const packedDeltaLow = packedDelta >>> 0;
      const packedDeltaHigh = Math.floor(packedDelta / UINT32_BASE);
      const lowSum = stateLow + minimumDeltaLow + packedDeltaLow;
      stateLow = lowSum >>> 0;
      // V8 strength-reduces division by this constant; explicit carry branches benchmark slower.
      stateHigh =
        (stateHigh + minimumDeltaHigh + packedDeltaHigh + Math.floor(lowSum / UINT32_BASE)) >>> 0;
      const wordOffset = (outputOffset + index) * 2;
      outputWords[wordOffset + lowWordOffset] = stateLow;
      outputWords[wordOffset + highWordOffset] = stateHigh;
    }
    state[0] = stateLow;
    state[1] = stateHigh;
    return;
  }

  const highBitWidth = bitWidth - 32;
  const highMask = highBitWidth === 32 ? 0xffff_ffff : 2 ** highBitWidth - 1;
  for (let index = 0; index < count; index++) {
    const packedBitOffset = index * bitWidth;
    const byteOffset = packedOffset + Math.floor(packedBitOffset / 8);
    const shift = packedBitOffset & 7;
    const lowerWord = readUint32LELoose(buffer, byteOffset);
    const middleWord = readUint32LELoose(buffer, byteOffset + 4);
    let packedDeltaLow: number;
    let packedDeltaHigh: number;
    if (shift === 0) {
      packedDeltaLow = lowerWord;
      packedDeltaHigh = middleWord & highMask;
    } else {
      const upperByte = buffer[byteOffset + 8] ?? 0;
      packedDeltaLow = ((lowerWord >>> shift) | (middleWord << (32 - shift))) >>> 0;
      packedDeltaHigh = ((middleWord >>> shift) | (upperByte << (32 - shift))) & highMask;
    }
    const lowSum = stateLow + minimumDeltaLow + packedDeltaLow;
    stateLow = lowSum >>> 0;
    // V8 strength-reduces division by this constant; explicit carry branches benchmark slower.
    stateHigh =
      (stateHigh + minimumDeltaHigh + packedDeltaHigh + Math.floor(lowSum / UINT32_BASE)) >>> 0;
    const wordOffset = (outputOffset + index) * 2;
    outputWords[wordOffset + lowWordOffset] = stateLow;
    outputWords[wordOffset + highWordOffset] = stateHigh;
  }
  state[0] = stateLow;
  state[1] = stateHigh;
}

/** Decodes an INT64 mini-block whose packed deltas fit a 32-bit bit reservoir. */
function decodeNarrowInt64ArrowMiniBlock(
  buffer: Uint8Array,
  packedOffset: number,
  bitWidth: number,
  count: number,
  minimumDeltaLow: number,
  minimumDeltaHigh: number,
  state: Uint32Array,
  outputWords: Uint32Array,
  outputOffset: number
): void {
  const mask = 2 ** bitWidth - 1;
  const lowWordOffset = IS_LITTLE_ENDIAN ? 0 : 1;
  const highWordOffset = IS_LITTLE_ENDIAN ? 1 : 0;
  let stateLow = state[0];
  let stateHigh = state[1];
  let packedBits = 0;
  let packedBitCount = 0;
  let byteOffset = packedOffset;

  for (let index = 0; index < count; index++) {
    while (packedBitCount < bitWidth) {
      packedBits |= buffer[byteOffset++] << packedBitCount;
      packedBitCount += 8;
    }
    const packedDelta = packedBits & mask;
    packedBits >>>= bitWidth;
    packedBitCount -= bitWidth;
    const lowSum = stateLow + minimumDeltaLow + packedDelta;
    stateLow = lowSum >>> 0;
    // V8 strength-reduces division by this constant; explicit carry branches benchmark slower.
    stateHigh = (stateHigh + minimumDeltaHigh + Math.floor(lowSum / UINT32_BASE)) >>> 0;
    const wordOffset = (outputOffset + index) * 2;
    outputWords[wordOffset + lowWordOffset] = stateLow;
    outputWords[wordOffset + highWordOffset] = stateHigh;
  }
  state[0] = stateLow;
  state[1] = stateHigh;
}

/** Reads an unaligned little-endian word, treating bytes beyond a mini-block as zero. */
function readUint32LELoose(buffer: Uint8Array, offset: number): number {
  return (
    ((buffer[offset] ?? 0) |
      ((buffer[offset + 1] ?? 0) << 8) |
      ((buffer[offset + 2] ?? 0) << 16) |
      ((buffer[offset + 3] ?? 0) << 24)) >>>
    0
  );
}

/** Writes one pair of 32-bit words into a platform-endian BigInt64Array backing buffer. */
function writeInt64Words(
  outputWords: Uint32Array,
  outputIndex: number,
  low: number,
  high: number
): void {
  const wordOffset = outputIndex * 2;
  outputWords[wordOffset + (IS_LITTLE_ENDIAN ? 0 : 1)] = low;
  outputWords[wordOffset + (IS_LITTLE_ENDIAN ? 1 : 0)] = high;
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
  const lengths = new Int32Array(count);
  decodeDeltaBinaryPackedValues('INT32', cursor, count, {output: lengths});
  if (options.byteArrayOutput) {
    return decodeDeltaLengthByteArraysToContiguousOutput(cursor, lengths, options);
  }
  const {output, outputOffset} = getParquetValueOutput(options, count);
  for (let index = 0; index < count; index++) {
    output[outputOffset + index] = readByteArray(cursor, lengths[index]);
  }
  return output;
}

/** Copies DELTA_LENGTH_BYTE_ARRAY's contiguous payload directly into an Arrow byte buffer. */
function decodeDeltaLengthByteArraysToContiguousOutput(
  cursor: CursorBuffer,
  lengths: Int32Array,
  options: ParquetCodecOptions
): ParquetValueBuffer {
  const byteArrayOutput = options.byteArrayOutput!;
  const outputOffset = options.outputOffset || 0;
  let payloadByteLength = 0;
  for (const length of lengths) {
    if (length < 0) {
      throw new Error(`Invalid delta byte-array length ${length}`);
    }
    payloadByteLength += length;
  }
  assertReadable(cursor, payloadByteLength);
  reserveParquetByteArrayOutput(byteArrayOutput, payloadByteLength);

  let byteOffset = byteArrayOutput.byteLength;
  byteArrayOutput.valueOffsets[outputOffset] = byteOffset;
  const payloadEnd = cursor.offset + payloadByteLength;
  byteArrayOutput.data.set(cursor.buffer.subarray(cursor.offset, payloadEnd), byteOffset);
  cursor.offset = payloadEnd;
  for (let valueIndex = 0; valueIndex < lengths.length; valueIndex++) {
    byteOffset += lengths[valueIndex];
    byteArrayOutput.valueOffsets[outputOffset + valueIndex + 1] = byteOffset;
  }
  byteArrayOutput.byteLength = byteOffset;
  return options.output || [];
}

/** Decodes prefix lengths and delta-length suffixes into complete byte-array values. */
export function decodeDeltaByteArrayValues(
  type: PrimitiveType,
  cursor: CursorBuffer,
  count: number,
  options: ParquetCodecOptions
): ParquetValueBuffer {
  assertByteArrayType(type, 'DELTA_BYTE_ARRAY');
  // One combined allocation is faster than separate prefix/suffix buffers in V8. Keep the two
  // subarray views: reusing Arrow offsets as scratch storage deoptimizes reconstruction.
  const lengths = new Int32Array(count * 2);
  const prefixLengths = lengths.subarray(0, count);
  const suffixLengths = lengths.subarray(count);
  decodeDeltaBinaryPackedValues('INT32', cursor, count, {output: prefixLengths});
  decodeDeltaBinaryPackedValues('INT32', cursor, count, {output: suffixLengths});
  if (options.byteArrayOutput) {
    return decodeDeltaByteArraysToContiguousOutput(cursor, prefixLengths, suffixLengths, options);
  }
  const {output, outputOffset} = getParquetValueOutput(options, count);
  let previousValue: Uint8Array | undefined;

  for (let index = 0; index < count; index++) {
    const prefixLength = prefixLengths[index];
    if (prefixLength < 0 || (prefixLength > 0 && prefixLength > (previousValue?.length || 0))) {
      throw new Error(`Invalid DELTA_BYTE_ARRAY prefix length ${prefixLength}`);
    }
    const suffix = readByteArray(cursor, suffixLengths[index]);
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

/** Reconstructs DELTA_BYTE_ARRAY values directly in one Arrow-compatible byte buffer. */
function decodeDeltaByteArraysToContiguousOutput(
  cursor: CursorBuffer,
  prefixLengths: Int32Array,
  suffixLengths: Int32Array,
  options: ParquetCodecOptions
): ParquetValueBuffer {
  const byteArrayOutput = options.byteArrayOutput!;
  const outputOffset = options.outputOffset || 0;
  let byteOffset = byteArrayOutput.byteLength;
  let previousValueOffset = byteOffset;
  let previousValueLength = 0;
  byteArrayOutput.valueOffsets[outputOffset] = byteOffset;

  let requiredByteLength = 0;
  let requiredSuffixByteLength = 0;
  for (let valueIndex = 0; valueIndex < prefixLengths.length; valueIndex++) {
    const prefixLength = prefixLengths[valueIndex];
    const suffixLength = suffixLengths[valueIndex];
    if (prefixLength < 0 || prefixLength > previousValueLength) {
      throw new Error(`Invalid DELTA_BYTE_ARRAY prefix length ${prefixLength}`);
    }
    if (suffixLength < 0) {
      throw new Error(`Invalid delta byte-array length ${suffixLength}`);
    }
    previousValueLength = prefixLength + suffixLength;
    requiredByteLength += previousValueLength;
    requiredSuffixByteLength += suffixLength;
  }
  assertReadable(cursor, requiredSuffixByteLength);
  reserveParquetByteArrayOutput(byteArrayOutput, requiredByteLength);

  const data = byteArrayOutput.data;
  const valueOffsets = byteArrayOutput.valueOffsets;
  const inputBuffer = cursor.buffer;
  let inputOffset = cursor.offset;
  previousValueLength = 0;
  for (let valueIndex = 0; valueIndex < prefixLengths.length; valueIndex++) {
    const prefixLength = prefixLengths[valueIndex];
    const suffixLength = suffixLengths[valueIndex];
    const valueLength = prefixLength + suffixLength;
    if (prefixLength > 0) {
      if (prefixLength <= 15) {
        for (let byteIndex = 0; byteIndex < prefixLength; byteIndex++) {
          data[byteOffset + byteIndex] = data[previousValueOffset + byteIndex];
        }
      } else {
        data.copyWithin(byteOffset, previousValueOffset, previousValueOffset + prefixLength);
      }
    }
    const suffixEnd = inputOffset + suffixLength;
    if (suffixLength <= 15) {
      let suffixOutputOffset = byteOffset + prefixLength;
      while (inputOffset < suffixEnd) {
        data[suffixOutputOffset++] = inputBuffer[inputOffset++];
      }
    } else {
      data.set(inputBuffer.subarray(inputOffset, suffixEnd), byteOffset + prefixLength);
      inputOffset = suffixEnd;
    }
    previousValueOffset = byteOffset;
    previousValueLength = valueLength;
    byteOffset += valueLength;
    valueOffsets[outputOffset + valueIndex + 1] = byteOffset;
  }
  cursor.offset = inputOffset;
  byteArrayOutput.byteLength = byteOffset;
  return options.output || [];
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

/** Reads one signed zig-zag INT64 directly into its low and high two's-complement words. */
function readZigZagVarIntWords(cursor: CursorBuffer, words: Uint32Array): void {
  let low = 0;
  let high = 0;
  for (let byteIndex = 0; byteIndex < 10; byteIndex++) {
    assertReadable(cursor, 1);
    const byte = cursor.buffer[cursor.offset++];
    const payload = byte & 0x7f;
    const bitOffset = byteIndex * 7;
    if (byteIndex === 9 && payload > 1) {
      throw new Error('Invalid Parquet variable-length integer');
    }
    if (bitOffset < 32) {
      low |= payload << bitOffset;
      if (bitOffset > 25) {
        high |= payload >>> (32 - bitOffset);
      }
    } else {
      high |= payload << (bitOffset - 32);
    }
    if ((byte & 0x80) === 0) {
      const negative = low & 1;
      let decodedLow = ((low >>> 1) | ((high & 1) << 31)) >>> 0;
      let decodedHigh = high >>> 1;
      if (negative) {
        decodedLow = ~decodedLow >>> 0;
        decodedHigh = ~decodedHigh >>> 0;
      }
      words[0] = decodedLow;
      words[1] = decodedHigh;
      return;
    }
  }
  throw new Error('Invalid Parquet variable-length integer');
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
