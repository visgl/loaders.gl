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
      for (let index = 0; index < outputCount; index++) {
        output[initialOutputOffset + outputOffset + index] = resolvedValue;
      }
      outputOffset += outputCount;
    }
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
    for (let index = 0; index < outputCount; index++) {
      output[outputOffset + index] = resolvedValue;
    }
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
  if (bitWidth === 8) {
    for (let valueIndex = 0; valueIndex < count; valueIndex++) {
      const value = buffer[packedOffset + valueIndex] ?? 0;
      output[outputOffset + valueIndex] = resolveDictionaryValue(value, dictionary);
    }
    return;
  }

  const mask = 2 ** bitWidth - 1;
  let packedBits = 0;
  let packedBitCount = 0;
  let byteOffset = packedOffset;
  for (let valueIndex = 0; valueIndex < count; valueIndex++) {
    while (packedBitCount < bitWidth) {
      packedBits |= (buffer[byteOffset++] ?? 0) << packedBitCount;
      packedBitCount += 8;
    }
    const value = packedBits & mask;
    output[outputOffset + valueIndex] = resolveDictionaryValue(value, dictionary);
    packedBits >>>= bitWidth;
    packedBitCount -= bitWidth;
  }
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

  for (let i = 0; i < values.length % 8; i++) {
    values.push(0);
  }

  const buf = new Uint8Array(Math.ceil(bitWidth * (values.length / 8)));
  for (let b = 0; b < bitWidth * values.length; b++) {
    if ((values[Math.floor(b / bitWidth)] & (1 << (b % bitWidth))) > 0) {
      buf[Math.floor(b / 8)] |= 1 << (b % 8);
    }
  }

  return concatUint8Arrays([Uint8Array.from(varint.encode(((values.length / 8) << 1) | 1)), buf]);
}

function encodeRunRepeated(value: number, count: number, opts: ParquetCodecOptions): Uint8Array {
  // @ts-ignore
  const bitWidth: number = opts.bitWidth;

  const buf = new Uint8Array(Math.ceil(bitWidth / 8));

  for (let i = 0; i < buf.length; i++) {
    buf[i] = value & 0xff;
    // eslint-disable-next-line
    value >> 8; //  TODO - this looks wrong
  }

  return concatUint8Arrays([Uint8Array.from(varint.encode(count << 1)), buf]);
}
