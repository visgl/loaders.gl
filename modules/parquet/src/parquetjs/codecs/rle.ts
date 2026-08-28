// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Copyright (c) 2017 ironSource Ltd.
// Forked from https://github.com/kbajalc/parquets under MIT license

import type {PrimitiveType} from '../schema/declare';
import {
  getParquetValueOutput,
  type CursorBuffer,
  type ParquetCodecOptions,
  type ParquetValueBuffer
} from './declare';
import {concatUint8Arrays, writeUInt32LE} from '../utils/binary-utils';
import varint from 'varint';

// eslint-disable-next-line max-statements, complexity
export function encodeValues(
  type: PrimitiveType,
  values: any[],
  opts: ParquetCodecOptions
): Uint8Array {
  if (!('bitWidth' in opts)) {
    throw new Error('bitWidth is required');
  }

  switch (type) {
    case 'BOOLEAN':
    case 'INT32':
    case 'INT64':
      // tslint:disable-next-line:no-parameter-reassignment
      values = values.map(x => parseInt(x, 10));
      break;

    default:
      throw new Error(`unsupported type: ${type}`);
  }

  const buffers: Uint8Array[] = [];
  let run: any[] = [];
  let repeats = 0;

  for (let i = 0; i < values.length; i++) {
    // If we are at the beginning of a run and the next value is same we start
    // collecting repeated values
    if (repeats === 0 && run.length % 8 === 0 && values[i] === values[i + 1]) {
      // If we have any data in runs we need to encode them
      if (run.length) {
        buffers.push(encodeRunBitpacked(run, opts));
        run = [];
      }
      repeats = 1;
    } else if (repeats > 0 && values[i] === values[i - 1]) {
      repeats += 1;
    } else {
      // If values changes we need to post any previous repeated values
      if (repeats) {
        buffers.push(encodeRunRepeated(values[i - 1], repeats, opts));
        repeats = 0;
      }
      run.push(values[i]);
    }
  }

  if (repeats) {
    buffers.push(encodeRunRepeated(values[values.length - 1], repeats, opts));
  } else if (run.length) {
    buffers.push(encodeRunBitpacked(run, opts));
  }

  const buf = concatUint8Arrays(buffers);
  if (opts.disableEnvelope) {
    return buf;
  }

  const envelope = new Uint8Array(buf.length + 4);
  writeUInt32LE(envelope, buf.length, 0);
  envelope.set(buf, 4);

  return envelope;
}

export function decodeValues(
  type: PrimitiveType,
  cursor: CursorBuffer,
  count: number,
  options: ParquetCodecOptions
): ParquetValueBuffer {
  if (!('bitWidth' in options)) {
    throw new Error('bitWidth is required');
  }
  const bitWidth = options.bitWidth!;
  if (!Number.isInteger(bitWidth) || bitWidth < 0 || bitWidth > 64) {
    throw new Error(`invalid bit width: ${bitWidth}`);
  }
  if (!Number.isInteger(count) || count < 0) {
    throw new Error(`invalid value count: ${count}`);
  }

  if (!options.disableEnvelope) {
    assertReadable(cursor, 4);
    cursor.offset += 4;
  }

  const {output, outputOffset: initialOutputOffset} = getParquetValueOutput(options, count);
  let outputOffset = 0;
  while (outputOffset < count) {
    const header = readUnsignedVarIntNumber(cursor);
    if (header % 2 === 1) {
      const runValueCount = ((header - 1) / 2) * 8;
      if (runValueCount === 0) {
        throw new Error('invalid RLE bit-packed run length');
      }
      const outputCount = Math.min(runValueCount, count - outputOffset);
      decodeBitPackedRun(
        cursor,
        runValueCount,
        outputCount,
        bitWidth,
        output,
        initialOutputOffset + outputOffset,
        options.dictionary
      );
      outputOffset += outputCount;
    } else {
      const runValueCount = header / 2;
      if (runValueCount === 0) {
        throw new Error('invalid RLE repeated run length');
      }
      const outputCount = Math.min(runValueCount, count - outputOffset);
      const value = decodeRepeatedRun(cursor, bitWidth);
      const resolvedValue = resolveDictionaryValue(value, options.dictionary);
      fillParquetValueBuffer(
        output,
        resolvedValue,
        initialOutputOffset + outputOffset,
        initialOutputOffset + outputOffset + outputCount
      );
      outputOffset += outputCount;
    }
  }

  return output;
}

/** Encodes legacy Parquet BIT_PACKED values, including the optional page length envelope. */
export function encodeBitPackedValues(
  type: PrimitiveType,
  values: any[],
  options: ParquetCodecOptions
): Uint8Array {
  if (!('bitWidth' in options)) {
    throw new Error('bitWidth is required');
  }
  const bitWidth = options.bitWidth!;
  if (!Number.isInteger(bitWidth) || bitWidth < 0 || bitWidth > 32) {
    throw new Error(`invalid bit width: ${bitWidth}`);
  }
  if (type !== 'BOOLEAN' && type !== 'INT32' && type !== 'INT64') {
    throw new Error(`unsupported type: ${type}`);
  }
  const paddedValueCount = Math.ceil(values.length / 8) * 8;
  const encoded = new Uint8Array(Math.ceil((paddedValueCount * bitWidth) / 8));
  for (let valueIndex = 0; valueIndex < values.length; valueIndex++) {
    let value = Number(values[valueIndex]);
    for (let bitIndex = 0; bitIndex < bitWidth; bitIndex++) {
      if (value & (1 << bitIndex)) {
        const packedBit = valueIndex * bitWidth + bitIndex;
        encoded[Math.floor(packedBit / 8)] |= 1 << (packedBit % 8);
      }
    }
  }
  if (options.disableEnvelope) {
    return encoded;
  }
  const envelope = new Uint8Array(encoded.length + 4);
  writeUInt32LE(envelope, encoded.length, 0);
  envelope.set(encoded, 4);
  return envelope;
}

/** Decodes legacy Parquet BIT_PACKED values, including the optional page length envelope. */
export function decodeBitPackedValues(
  type: PrimitiveType,
  cursor: CursorBuffer,
  count: number,
  options: ParquetCodecOptions
): ParquetValueBuffer {
  if (!('bitWidth' in options)) {
    throw new Error('bitWidth is required');
  }
  const bitWidth = options.bitWidth!;
  if (!Number.isInteger(bitWidth) || bitWidth < 0 || bitWidth > 64) {
    throw new Error(`invalid bit width: ${bitWidth}`);
  }
  if (!Number.isInteger(count) || count < 0) {
    throw new Error(`invalid value count: ${count}`);
  }
  const envelopeEnd = options.disableEnvelope
    ? undefined
    : (() => {
        assertReadable(cursor, 4);
        const length =
          cursor.buffer[cursor.offset] |
          (cursor.buffer[cursor.offset + 1] << 8) |
          (cursor.buffer[cursor.offset + 2] << 16) |
          (cursor.buffer[cursor.offset + 3] << 24);
        cursor.offset += 4;
        if (length < 0) throw new Error('invalid BIT_PACKED length');
        assertReadable(cursor, length);
        return cursor.offset + length;
      })();
  const paddedValueCount = Math.ceil(count / 8) * 8;
  const packedByteLength = Math.ceil((paddedValueCount * bitWidth) / 8);
  assertReadable(cursor, packedByteLength);
  const {output, outputOffset} = getParquetValueOutput(options, count);
  decodeBitPackedRun(cursor, paddedValueCount, count, bitWidth, output, outputOffset);
  if (envelopeEnd !== undefined) {
    if (cursor.offset > envelopeEnd) throw new Error('invalid BIT_PACKED length');
    cursor.offset = envelopeEnd;
  }
  return output;
}

/** Decodes one complete bit-packed run directly into the caller's output array. */
function decodeBitPackedRun(
  cursor: CursorBuffer,
  runValueCount: number,
  outputCount: number,
  bitWidth: number,
  output: ParquetValueBuffer,
  outputOffset: number,
  dictionary?: readonly unknown[]
): void {
  if (runValueCount % 8 !== 0) {
    throw new Error('must be a multiple of 8');
  }
  const packedByteLength = bitWidth * (runValueCount / 8);
  const packedOffset = cursor.offset;
  const size = cursor.size ?? cursor.buffer.length;
  // Preserve compatibility with files whose malformed final dictionary run omits encoded bytes.
  cursor.offset = Math.min(cursor.offset + packedByteLength, size);

  if (bitWidth === 0) {
    const resolvedValue = resolveDictionaryValue(0, dictionary);
    fillParquetValueBuffer(output, resolvedValue, outputOffset, outputOffset + outputCount);
    return;
  }
  if (bitWidth <= 24) {
    decodeUint32BitPackedRun(
      cursor.buffer,
      packedOffset,
      outputCount,
      bitWidth,
      output,
      outputOffset,
      dictionary
    );
    return;
  }
  if (bitWidth <= 45) {
    decodeNumberBitPackedRun(
      cursor.buffer,
      packedOffset,
      outputCount,
      bitWidth,
      output,
      outputOffset,
      dictionary
    );
    return;
  }

  const bitWidthBigInt = BigInt(bitWidth);
  const mask = (1n << bitWidthBigInt) - 1n;
  let packedBits = 0n;
  let packedBitCount = 0;
  let byteOffset = packedOffset;
  for (let valueIndex = 0; valueIndex < outputCount; valueIndex++) {
    while (packedBitCount < bitWidth) {
      packedBits |= BigInt(cursor.buffer[byteOffset++] ?? 0) << BigInt(packedBitCount);
      packedBitCount += 8;
    }
    const value = Number(packedBits & mask);
    output[outputOffset + valueIndex] = resolveDictionaryValue(value, dictionary);
    packedBits >>= bitWidthBigInt;
    packedBitCount -= bitWidth;
  }
}

/** Fills a decoder destination while preserving bigint typed-array semantics. */
function fillParquetValueBuffer(
  output: ParquetValueBuffer,
  value: unknown,
  start: number,
  end: number
): void {
  if (output instanceof BigInt64Array) {
    output.fill(typeof value === 'bigint' ? value : BigInt(value as number), start, end);
    return;
  }
  if (Array.isArray(output)) {
    output.fill(value, start, end);
    return;
  }
  output.fill(Number(value), start, end);
}

/** Decodes common narrow bit widths with a fast 32-bit reservoir. */
function decodeUint32BitPackedRun(
  buffer: Uint8Array,
  packedOffset: number,
  count: number,
  bitWidth: number,
  output: ParquetValueBuffer,
  outputOffset: number,
  dictionary?: readonly unknown[]
): void {
  if (!dictionary && bitWidth <= 4) {
    decodeNarrowUnsignedBitPackedRun(buffer, packedOffset, count, bitWidth, output, outputOffset);
    return;
  }
  if (dictionary && bitWidth <= 4) {
    decodeNarrowDictionaryBitPackedRun(
      buffer,
      packedOffset,
      count,
      bitWidth,
      output,
      outputOffset,
      dictionary
    );
    return;
  }
  if (dictionary && bitWidth === 10) {
    decode10BitDictionaryRun(buffer, packedOffset, count, output, outputOffset, dictionary);
    return;
  }
  if (dictionary && bitWidth === 12) {
    decode12BitDictionaryRun(buffer, packedOffset, count, output, outputOffset, dictionary);
    return;
  }
  if (bitWidth === 8) {
    if (dictionary) {
      for (let valueIndex = 0; valueIndex < count; valueIndex++) {
        const value = buffer[packedOffset + valueIndex] ?? 0;
        if (value >= dictionary.length) {
          throw new Error(`Invalid Parquet dictionary index ${value}`);
        }
        output[outputOffset + valueIndex] = dictionary[value];
      }
      return;
    }
    for (let valueIndex = 0; valueIndex < count; valueIndex++) {
      output[outputOffset + valueIndex] = buffer[packedOffset + valueIndex] ?? 0;
    }
    return;
  }

  const mask = 2 ** bitWidth - 1;
  let packedBits = 0;
  let packedBitCount = 0;
  let byteOffset = packedOffset;
  if (dictionary) {
    for (let valueIndex = 0; valueIndex < count; valueIndex++) {
      while (packedBitCount < bitWidth) {
        packedBits |= (buffer[byteOffset++] ?? 0) << packedBitCount;
        packedBitCount += 8;
      }
      const value = packedBits & mask;
      if (value >= dictionary.length) {
        throw new Error(`Invalid Parquet dictionary index ${value}`);
      }
      output[outputOffset + valueIndex] = dictionary[value];
      packedBits >>>= bitWidth;
      packedBitCount -= bitWidth;
    }
    return;
  }
  for (let valueIndex = 0; valueIndex < count; valueIndex++) {
    while (packedBitCount < bitWidth) {
      packedBits |= (buffer[byteOffset++] ?? 0) << packedBitCount;
      packedBitCount += 8;
    }
    const value = packedBits & mask;
    output[outputOffset + valueIndex] = value;
    packedBits >>>= bitWidth;
    packedBitCount -= bitWidth;
  }
}

/** Decodes complete groups of eight narrow unsigned values without a per-value reservoir. */
function decodeNarrowUnsignedBitPackedRun(
  buffer: Uint8Array,
  packedOffset: number,
  count: number,
  bitWidth: number,
  output: ParquetValueBuffer,
  outputOffset: number
): void {
  if (bitWidth === 1) {
    decode1BitUnsignedRun(buffer, packedOffset, count, output, outputOffset);
    return;
  }
  if (bitWidth === 2) {
    decode2BitUnsignedRun(buffer, packedOffset, count, output, outputOffset);
    return;
  }
  const mask = 2 ** bitWidth - 1;
  let byteOffset = packedOffset;
  let valueIndex = 0;
  while (valueIndex < count) {
    const packedBits =
      (buffer[byteOffset] ?? 0) |
      ((buffer[byteOffset + 1] ?? 0) << 8) |
      ((buffer[byteOffset + 2] ?? 0) << 16) |
      ((buffer[byteOffset + 3] ?? 0) << 24);
    const groupValueCount = Math.min(8, count - valueIndex);
    for (let groupIndex = 0; groupIndex < groupValueCount; groupIndex++) {
      output[outputOffset + valueIndex + groupIndex] =
        (packedBits >>> (groupIndex * bitWidth)) & mask;
    }
    byteOffset += bitWidth;
    valueIndex += groupValueCount;
  }
}

/** Expands byte-aligned groups of eight one-bit level values. */
function decode1BitUnsignedRun(
  buffer: Uint8Array,
  packedOffset: number,
  count: number,
  output: ParquetValueBuffer,
  outputOffset: number
): void {
  let byteOffset = packedOffset;
  let valueIndex = 0;
  while (valueIndex + 8 <= count) {
    const packedBits = buffer[byteOffset++] ?? 0;
    output[outputOffset + valueIndex] = packedBits & 1;
    output[outputOffset + valueIndex + 1] = (packedBits >>> 1) & 1;
    output[outputOffset + valueIndex + 2] = (packedBits >>> 2) & 1;
    output[outputOffset + valueIndex + 3] = (packedBits >>> 3) & 1;
    output[outputOffset + valueIndex + 4] = (packedBits >>> 4) & 1;
    output[outputOffset + valueIndex + 5] = (packedBits >>> 5) & 1;
    output[outputOffset + valueIndex + 6] = (packedBits >>> 6) & 1;
    output[outputOffset + valueIndex + 7] = packedBits >>> 7;
    valueIndex += 8;
  }
  const packedBits = buffer[byteOffset] ?? 0;
  for (let tailIndex = 0; valueIndex + tailIndex < count; tailIndex++) {
    output[outputOffset + valueIndex + tailIndex] = (packedBits >>> tailIndex) & 1;
  }
}

/** Expands two-byte groups of eight two-bit level values. */
function decode2BitUnsignedRun(
  buffer: Uint8Array,
  packedOffset: number,
  count: number,
  output: ParquetValueBuffer,
  outputOffset: number
): void {
  let byteOffset = packedOffset;
  let valueIndex = 0;
  while (valueIndex + 8 <= count) {
    const packedBits = (buffer[byteOffset] ?? 0) | ((buffer[byteOffset + 1] ?? 0) << 8);
    output[outputOffset + valueIndex] = packedBits & 3;
    output[outputOffset + valueIndex + 1] = (packedBits >>> 2) & 3;
    output[outputOffset + valueIndex + 2] = (packedBits >>> 4) & 3;
    output[outputOffset + valueIndex + 3] = (packedBits >>> 6) & 3;
    output[outputOffset + valueIndex + 4] = (packedBits >>> 8) & 3;
    output[outputOffset + valueIndex + 5] = (packedBits >>> 10) & 3;
    output[outputOffset + valueIndex + 6] = (packedBits >>> 12) & 3;
    output[outputOffset + valueIndex + 7] = (packedBits >>> 14) & 3;
    byteOffset += 2;
    valueIndex += 8;
  }
  const packedBits = (buffer[byteOffset] ?? 0) | ((buffer[byteOffset + 1] ?? 0) << 8);
  for (let tailIndex = 0; valueIndex + tailIndex < count; tailIndex++) {
    output[outputOffset + valueIndex + tailIndex] = (packedBits >>> (tailIndex * 2)) & 3;
  }
}

/** Resolves aligned groups of four 10-bit dictionary indices from five input bytes. */
function decode10BitDictionaryRun(
  buffer: Uint8Array,
  packedOffset: number,
  count: number,
  output: ParquetValueBuffer,
  outputOffset: number,
  dictionary: readonly unknown[]
): void {
  let byteOffset = packedOffset;
  let valueIndex = 0;
  while (valueIndex + 4 <= count) {
    const byte0 = buffer[byteOffset] ?? 0;
    const byte1 = buffer[byteOffset + 1] ?? 0;
    const byte2 = buffer[byteOffset + 2] ?? 0;
    const byte3 = buffer[byteOffset + 3] ?? 0;
    const byte4 = buffer[byteOffset + 4] ?? 0;
    const index0 = byte0 | ((byte1 & 0x03) << 8);
    const index1 = (byte1 >>> 2) | ((byte2 & 0x0f) << 6);
    const index2 = (byte2 >>> 4) | ((byte3 & 0x3f) << 4);
    const index3 = (byte3 >>> 6) | (byte4 << 2);
    if (
      index0 >= dictionary.length ||
      index1 >= dictionary.length ||
      index2 >= dictionary.length ||
      index3 >= dictionary.length
    ) {
      const invalidIndex = [index0, index1, index2, index3].find(
        dictionaryIndex => dictionaryIndex >= dictionary.length
      );
      throw new Error(`Invalid Parquet dictionary index ${invalidIndex}`);
    }
    output[outputOffset + valueIndex] = dictionary[index0];
    output[outputOffset + valueIndex + 1] = dictionary[index1];
    output[outputOffset + valueIndex + 2] = dictionary[index2];
    output[outputOffset + valueIndex + 3] = dictionary[index3];
    byteOffset += 5;
    valueIndex += 4;
  }
  decodeDictionaryBitPackedTail(
    buffer,
    byteOffset,
    count - valueIndex,
    10,
    output,
    outputOffset + valueIndex,
    dictionary
  );
}

/** Resolves aligned pairs of 12-bit dictionary indices from three input bytes. */
function decode12BitDictionaryRun(
  buffer: Uint8Array,
  packedOffset: number,
  count: number,
  output: ParquetValueBuffer,
  outputOffset: number,
  dictionary: readonly unknown[]
): void {
  let byteOffset = packedOffset;
  let valueIndex = 0;
  while (valueIndex + 2 <= count) {
    const byte0 = buffer[byteOffset] ?? 0;
    const byte1 = buffer[byteOffset + 1] ?? 0;
    const byte2 = buffer[byteOffset + 2] ?? 0;
    const index0 = byte0 | ((byte1 & 0x0f) << 8);
    const index1 = (byte1 >>> 4) | (byte2 << 4);
    if (index0 >= dictionary.length || index1 >= dictionary.length) {
      const invalidIndex = index0 >= dictionary.length ? index0 : index1;
      throw new Error(`Invalid Parquet dictionary index ${invalidIndex}`);
    }
    output[outputOffset + valueIndex] = dictionary[index0];
    output[outputOffset + valueIndex + 1] = dictionary[index1];
    byteOffset += 3;
    valueIndex += 2;
  }
  decodeDictionaryBitPackedTail(
    buffer,
    byteOffset,
    count - valueIndex,
    12,
    output,
    outputOffset + valueIndex,
    dictionary
  );
}

/** Resolves the byte-aligned remainder after a fixed-width dictionary group. */
function decodeDictionaryBitPackedTail(
  buffer: Uint8Array,
  packedOffset: number,
  count: number,
  bitWidth: number,
  output: ParquetValueBuffer,
  outputOffset: number,
  dictionary: readonly unknown[]
): void {
  const mask = 2 ** bitWidth - 1;
  let packedBits = 0;
  let packedBitCount = 0;
  let byteOffset = packedOffset;
  for (let valueIndex = 0; valueIndex < count; valueIndex++) {
    while (packedBitCount < bitWidth) {
      packedBits |= (buffer[byteOffset++] ?? 0) << packedBitCount;
      packedBitCount += 8;
    }
    const dictionaryIndex = packedBits & mask;
    if (dictionaryIndex >= dictionary.length) {
      throw new Error(`Invalid Parquet dictionary index ${dictionaryIndex}`);
    }
    output[outputOffset + valueIndex] = dictionary[dictionaryIndex];
    packedBits >>>= bitWidth;
    packedBitCount -= bitWidth;
  }
}

/** Resolves complete groups of eight narrow dictionary indices without a per-value reservoir. */
function decodeNarrowDictionaryBitPackedRun(
  buffer: Uint8Array,
  packedOffset: number,
  count: number,
  bitWidth: number,
  output: ParquetValueBuffer,
  outputOffset: number,
  dictionary: readonly unknown[]
): void {
  if (bitWidth === 1) {
    decode1BitDictionaryRun(buffer, packedOffset, count, output, outputOffset, dictionary);
    return;
  }
  if (bitWidth === 2) {
    decode2BitDictionaryRun(buffer, packedOffset, count, output, outputOffset, dictionary);
    return;
  }
  if (bitWidth === 3) {
    decode3BitDictionaryRun(buffer, packedOffset, count, output, outputOffset, dictionary);
    return;
  }
  if (bitWidth === 4) {
    decode4BitDictionaryRun(buffer, packedOffset, count, output, outputOffset, dictionary);
    return;
  }
  const mask = 2 ** bitWidth - 1;
  let byteOffset = packedOffset;
  let valueIndex = 0;
  while (valueIndex < count) {
    const packedBits =
      (buffer[byteOffset] ?? 0) |
      ((buffer[byteOffset + 1] ?? 0) << 8) |
      ((buffer[byteOffset + 2] ?? 0) << 16) |
      ((buffer[byteOffset + 3] ?? 0) << 24);
    const groupValueCount = Math.min(8, count - valueIndex);
    for (let groupIndex = 0; groupIndex < groupValueCount; groupIndex++) {
      const dictionaryIndex = (packedBits >>> (groupIndex * bitWidth)) & mask;
      if (dictionaryIndex >= dictionary.length) {
        throw new Error(`Invalid Parquet dictionary index ${dictionaryIndex}`);
      }
      output[outputOffset + valueIndex + groupIndex] = dictionary[dictionaryIndex];
    }
    byteOffset += bitWidth;
    valueIndex += groupValueCount;
  }
}

/** Resolves byte-aligned groups of eight one-bit dictionary indices. */
function decode1BitDictionaryRun(
  buffer: Uint8Array,
  packedOffset: number,
  count: number,
  output: ParquetValueBuffer,
  outputOffset: number,
  dictionary: readonly unknown[]
): void {
  let byteOffset = packedOffset;
  let valueIndex = 0;
  while (valueIndex + 8 <= count) {
    const packedBits = buffer[byteOffset++] ?? 0;
    if (dictionary.length < 2 && packedBits !== 0) {
      throw new Error('Invalid Parquet dictionary index 1');
    }
    output[outputOffset + valueIndex] = dictionary[packedBits & 1];
    output[outputOffset + valueIndex + 1] = dictionary[(packedBits >>> 1) & 1];
    output[outputOffset + valueIndex + 2] = dictionary[(packedBits >>> 2) & 1];
    output[outputOffset + valueIndex + 3] = dictionary[(packedBits >>> 3) & 1];
    output[outputOffset + valueIndex + 4] = dictionary[(packedBits >>> 4) & 1];
    output[outputOffset + valueIndex + 5] = dictionary[(packedBits >>> 5) & 1];
    output[outputOffset + valueIndex + 6] = dictionary[(packedBits >>> 6) & 1];
    output[outputOffset + valueIndex + 7] = dictionary[packedBits >>> 7];
    valueIndex += 8;
  }
  decodeDictionaryBitPackedTail(
    buffer,
    byteOffset,
    count - valueIndex,
    1,
    output,
    outputOffset + valueIndex,
    dictionary
  );
}

/** Resolves two-byte groups of eight two-bit dictionary indices. */
function decode2BitDictionaryRun(
  buffer: Uint8Array,
  packedOffset: number,
  count: number,
  output: ParquetValueBuffer,
  outputOffset: number,
  dictionary: readonly unknown[]
): void {
  let byteOffset = packedOffset;
  let valueIndex = 0;
  while (valueIndex + 8 <= count) {
    const packedBits = (buffer[byteOffset] ?? 0) | ((buffer[byteOffset + 1] ?? 0) << 8);
    const index0 = packedBits & 3;
    const index1 = (packedBits >>> 2) & 3;
    const index2 = (packedBits >>> 4) & 3;
    const index3 = (packedBits >>> 6) & 3;
    const index4 = (packedBits >>> 8) & 3;
    const index5 = (packedBits >>> 10) & 3;
    const index6 = (packedBits >>> 12) & 3;
    const index7 = packedBits >>> 14;
    if (
      index0 >= dictionary.length ||
      index1 >= dictionary.length ||
      index2 >= dictionary.length ||
      index3 >= dictionary.length ||
      index4 >= dictionary.length ||
      index5 >= dictionary.length ||
      index6 >= dictionary.length ||
      index7 >= dictionary.length
    ) {
      throw new Error('Invalid Parquet dictionary index');
    }
    output[outputOffset + valueIndex] = dictionary[index0];
    output[outputOffset + valueIndex + 1] = dictionary[index1];
    output[outputOffset + valueIndex + 2] = dictionary[index2];
    output[outputOffset + valueIndex + 3] = dictionary[index3];
    output[outputOffset + valueIndex + 4] = dictionary[index4];
    output[outputOffset + valueIndex + 5] = dictionary[index5];
    output[outputOffset + valueIndex + 6] = dictionary[index6];
    output[outputOffset + valueIndex + 7] = dictionary[index7];
    byteOffset += 2;
    valueIndex += 8;
  }
  decodeDictionaryBitPackedTail(
    buffer,
    byteOffset,
    count - valueIndex,
    2,
    output,
    outputOffset + valueIndex,
    dictionary
  );
}

/** Resolves byte-aligned groups of eight three-bit dictionary indices. */
function decode3BitDictionaryRun(
  buffer: Uint8Array,
  packedOffset: number,
  count: number,
  output: ParquetValueBuffer,
  outputOffset: number,
  dictionary: readonly unknown[]
): void {
  let byteOffset = packedOffset;
  let valueIndex = 0;
  while (valueIndex + 8 <= count) {
    const packedBits =
      (buffer[byteOffset] ?? 0) |
      ((buffer[byteOffset + 1] ?? 0) << 8) |
      ((buffer[byteOffset + 2] ?? 0) << 16);
    const index0 = packedBits & 7;
    const index1 = (packedBits >>> 3) & 7;
    const index2 = (packedBits >>> 6) & 7;
    const index3 = (packedBits >>> 9) & 7;
    const index4 = (packedBits >>> 12) & 7;
    const index5 = (packedBits >>> 15) & 7;
    const index6 = (packedBits >>> 18) & 7;
    const index7 = (packedBits >>> 21) & 7;
    if (
      index0 >= dictionary.length ||
      index1 >= dictionary.length ||
      index2 >= dictionary.length ||
      index3 >= dictionary.length ||
      index4 >= dictionary.length ||
      index5 >= dictionary.length ||
      index6 >= dictionary.length ||
      index7 >= dictionary.length
    ) {
      throw new Error('Invalid Parquet dictionary index');
    }
    output[outputOffset + valueIndex] = dictionary[index0];
    output[outputOffset + valueIndex + 1] = dictionary[index1];
    output[outputOffset + valueIndex + 2] = dictionary[index2];
    output[outputOffset + valueIndex + 3] = dictionary[index3];
    output[outputOffset + valueIndex + 4] = dictionary[index4];
    output[outputOffset + valueIndex + 5] = dictionary[index5];
    output[outputOffset + valueIndex + 6] = dictionary[index6];
    output[outputOffset + valueIndex + 7] = dictionary[index7];
    byteOffset += 3;
    valueIndex += 8;
  }
  decodeDictionaryBitPackedTail(
    buffer,
    byteOffset,
    count - valueIndex,
    3,
    output,
    outputOffset + valueIndex,
    dictionary
  );
}

/** Resolves pairs of four-bit dictionary indices from each input byte. */
function decode4BitDictionaryRun(
  buffer: Uint8Array,
  packedOffset: number,
  count: number,
  output: ParquetValueBuffer,
  outputOffset: number,
  dictionary: readonly unknown[]
): void {
  let byteOffset = packedOffset;
  let valueIndex = 0;
  while (valueIndex + 2 <= count) {
    const packedByte = buffer[byteOffset++] ?? 0;
    const index0 = packedByte & 15;
    const index1 = packedByte >>> 4;
    if (index0 >= dictionary.length || index1 >= dictionary.length) {
      throw new Error(
        `Invalid Parquet dictionary index ${index0 >= dictionary.length ? index0 : index1}`
      );
    }
    output[outputOffset + valueIndex] = dictionary[index0];
    output[outputOffset + valueIndex + 1] = dictionary[index1];
    valueIndex += 2;
  }
  decodeDictionaryBitPackedTail(
    buffer,
    byteOffset,
    count - valueIndex,
    4,
    output,
    outputOffset + valueIndex,
    dictionary
  );
}

/** Decodes a bit-packed run with an exact number-based bit reservoir. */
function decodeNumberBitPackedRun(
  buffer: Uint8Array,
  packedOffset: number,
  count: number,
  bitWidth: number,
  output: ParquetValueBuffer,
  outputOffset: number,
  dictionary?: readonly unknown[]
): void {
  const divisor = 2 ** bitWidth;
  let packedBits = 0;
  let packedBitCount = 0;
  let byteOffset = packedOffset;
  for (let valueIndex = 0; valueIndex < count; valueIndex++) {
    while (packedBitCount < bitWidth) {
      packedBits += (buffer[byteOffset++] ?? 0) * 2 ** packedBitCount;
      packedBitCount += 8;
    }
    const value = packedBits % divisor;
    output[outputOffset + valueIndex] = resolveDictionaryValue(value, dictionary);
    packedBits = Math.floor(packedBits / divisor);
    packedBitCount -= bitWidth;
  }
}

/** Resolves one dictionary index and rejects corrupt out-of-range references. */
function resolveDictionaryValue(value: number, dictionary?: readonly unknown[]): unknown {
  if (!dictionary) {
    return value;
  }
  if (value < 0 || value >= dictionary.length) {
    throw new Error(`Invalid Parquet dictionary index ${value}`);
  }
  return dictionary[value];
}

/** Decodes the single little-endian value stored by a repeated run. */
function decodeRepeatedRun(cursor: CursorBuffer, bitWidth: number): number {
  const byteWidth = Math.ceil(bitWidth / 8);
  assertReadable(cursor, byteWidth);
  if (byteWidth <= 6) {
    let value = 0;
    let multiplier = 1;
    for (let byteIndex = 0; byteIndex < byteWidth; byteIndex++) {
      value += cursor.buffer[cursor.offset++] * multiplier;
      multiplier *= 256;
    }
    return value;
  }

  let value = 0n;
  for (let byteIndex = 0; byteIndex < byteWidth; byteIndex++) {
    value |= BigInt(cursor.buffer[cursor.offset++]) << BigInt(byteIndex * 8);
  }
  return Number(value);
}

/** Reads an unsigned base-128 run header without allocating an intermediate buffer. */
function readUnsignedVarIntNumber(cursor: CursorBuffer): number {
  let value = 0;
  let multiplier = 1;
  for (let byteIndex = 0; byteIndex < 10; byteIndex++) {
    assertReadable(cursor, 1);
    const byte = cursor.buffer[cursor.offset++];
    value += (byte & 0x7f) * multiplier;
    if ((byte & 0x80) === 0) {
      if (!Number.isSafeInteger(value)) {
        throw new Error('RLE run header exceeds the safe integer range');
      }
      return value;
    }
    multiplier *= 128;
  }
  throw new Error('invalid RLE run header');
}

/** Ensures an RLE read stays within the current cursor. */
function assertReadable(cursor: CursorBuffer, byteLength: number): void {
  const size = cursor.size ?? cursor.buffer.length;
  if (byteLength < 0 || cursor.offset + byteLength > size) {
    throw new Error(
      `unexpected end of RLE data (offset=${cursor.offset}, requested=${byteLength}, size=${size})`
    );
  }
}

function encodeRunBitpacked(values: number[], opts: ParquetCodecOptions): Uint8Array {
  // @ts-ignore
  const bitWidth: number = opts.bitWidth;

  const paddedValues = values.slice();
  const padding = (8 - (paddedValues.length % 8)) % 8;
  for (let index = 0; index < padding; index++) {
    paddedValues.push(0);
  }

  const buf = new Uint8Array(Math.ceil(bitWidth * (paddedValues.length / 8)));
  for (let b = 0; b < bitWidth * paddedValues.length; b++) {
    if ((paddedValues[Math.floor(b / bitWidth)] & (1 << (b % bitWidth))) > 0) {
      buf[Math.floor(b / 8)] |= 1 << (b % 8);
    }
  }

  return concatUint8Arrays([
    Uint8Array.from(varint.encode(((paddedValues.length / 8) << 1) | 1)),
    buf
  ]);
}

function encodeRunRepeated(value: number, count: number, opts: ParquetCodecOptions): Uint8Array {
  // @ts-ignore
  const bitWidth: number = opts.bitWidth;

  const buf = new Uint8Array(Math.ceil(bitWidth / 8));

  for (let i = 0; i < buf.length; i++) {
    buf[i] = value & 0xff;
    value = Math.floor(value / 256);
  }

  return concatUint8Arrays([Uint8Array.from(varint.encode(count << 1)), buf]);
}
