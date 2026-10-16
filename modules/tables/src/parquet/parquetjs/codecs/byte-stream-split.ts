// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {PrimitiveType} from '../schema/declare';
import {copyUint8Array, toUint8Array} from '../utils/binary-utils';
import {
  getParquetValueOutput,
  type CursorBuffer,
  type ParquetCodecOptions,
  type ParquetValueBuffer
} from './declare';

/** Physical Parquet types accepted by BYTE_STREAM_SPLIT. */
const BYTE_STREAM_SPLIT_TYPES = new Set<PrimitiveType>([
  'INT32',
  'INT64',
  'FLOAT',
  'DOUBLE',
  'FIXED_LEN_BYTE_ARRAY'
]);

/** Whether typed-array storage uses the little-endian layout required by Parquet. */
const IS_LITTLE_ENDIAN = new Uint8Array(new Uint16Array([1]).buffer)[0] === 1;

/** Returns whether a physical Parquet type supports BYTE_STREAM_SPLIT. */
export function isByteStreamSplitType(type: PrimitiveType): boolean {
  return BYTE_STREAM_SPLIT_TYPES.has(type);
}

/** Encodes fixed-width physical values using Parquet BYTE_STREAM_SPLIT. */
export function encodeValues(
  type: PrimitiveType,
  values: any[],
  options: ParquetCodecOptions
): Uint8Array {
  const byteWidth = getByteWidth(type, options);
  const contiguousBytes = encodeContiguousValues(type, values, byteWidth);
  const encodedBytes = new Uint8Array(contiguousBytes.length);

  for (let byteIndex = 0; byteIndex < byteWidth; byteIndex++) {
    const streamOffset = byteIndex * values.length;
    for (let valueIndex = 0; valueIndex < values.length; valueIndex++) {
      encodedBytes[streamOffset + valueIndex] = contiguousBytes[valueIndex * byteWidth + byteIndex];
    }
  }
  return encodedBytes;
}

/** Decodes Parquet BYTE_STREAM_SPLIT values into an optional column destination. */
export function decodeValues(
  type: PrimitiveType,
  cursor: CursorBuffer,
  count: number,
  options: ParquetCodecOptions
): ParquetValueBuffer {
  const byteWidth = getByteWidth(type, options);
  const {output, outputOffset} = getParquetValueOutput(options, count);
  const directOutputBytes = getDirectOutputBytes(
    type,
    output,
    outputOffset,
    count,
    options.int64AsBigInt
  );
  const contiguousBytes = decodeContiguousBytes(cursor, count, byteWidth, directOutputBytes);

  if (directOutputBytes) {
    return output;
  }

  if (type === 'FIXED_LEN_BYTE_ARRAY') {
    for (let valueIndex = 0; valueIndex < count; valueIndex++) {
      const value = contiguousBytes.subarray(valueIndex * byteWidth, (valueIndex + 1) * byteWidth);
      output[outputOffset + valueIndex] = options.retainByteArrayViews
        ? value
        : copyUint8Array(value);
    }
    return output;
  }

  const dataView = new DataView(
    contiguousBytes.buffer,
    contiguousBytes.byteOffset,
    contiguousBytes.byteLength
  );
  for (let valueIndex = 0; valueIndex < count; valueIndex++) {
    const byteOffset = valueIndex * byteWidth;
    switch (type) {
      case 'INT32':
        output[outputOffset + valueIndex] = dataView.getInt32(byteOffset, true);
        break;
      case 'INT64': {
        const value = dataView.getBigInt64(byteOffset, true);
        output[outputOffset + valueIndex] = options.int64AsBigInt ? value : Number(value);
        break;
      }
      case 'FLOAT':
        output[outputOffset + valueIndex] = dataView.getFloat32(byteOffset, true);
        break;
      case 'DOUBLE':
        output[outputOffset + valueIndex] = dataView.getFloat64(byteOffset, true);
        break;
      default:
        throw new Error(`BYTE_STREAM_SPLIT does not support ${type}`);
    }
  }
  return output;
}

/** Returns the fixed byte width for one BYTE_STREAM_SPLIT physical type. */
function getByteWidth(type: PrimitiveType, options: ParquetCodecOptions): number {
  switch (type) {
    case 'INT32':
    case 'FLOAT':
      return 4;
    case 'INT64':
    case 'DOUBLE':
      return 8;
    case 'FIXED_LEN_BYTE_ARRAY':
      if (!options.typeLength || options.typeLength < 1) {
        throw new Error(
          'missing option: typeLength (required for BYTE_STREAM_SPLIT FIXED_LEN_BYTE_ARRAY)'
        );
      }
      return options.typeLength;
    default:
      throw new Error(`BYTE_STREAM_SPLIT does not support ${type}`);
  }
}

/** Serializes values in the ordinary little-endian physical layout before transposition. */
function encodeContiguousValues(type: PrimitiveType, values: any[], byteWidth: number): Uint8Array {
  const contiguousBytes = new Uint8Array(values.length * byteWidth);
  const dataView = new DataView(contiguousBytes.buffer);

  for (let valueIndex = 0; valueIndex < values.length; valueIndex++) {
    const byteOffset = valueIndex * byteWidth;
    switch (type) {
      case 'INT32':
        dataView.setInt32(byteOffset, values[valueIndex], true);
        break;
      case 'INT64':
        dataView.setBigInt64(byteOffset, BigInt(values[valueIndex]), true);
        break;
      case 'FLOAT':
        dataView.setFloat32(byteOffset, values[valueIndex], true);
        break;
      case 'DOUBLE':
        dataView.setFloat64(byteOffset, values[valueIndex], true);
        break;
      case 'FIXED_LEN_BYTE_ARRAY': {
        const value = toUint8Array(values[valueIndex]);
        if (value.byteLength !== byteWidth) {
          throw new Error(
            `invalid BYTE_STREAM_SPLIT FIXED_LEN_BYTE_ARRAY width: expected ${byteWidth}, received ${value.byteLength}`
          );
        }
        contiguousBytes.set(value, byteOffset);
        break;
      }
      default:
        throw new Error(`BYTE_STREAM_SPLIT does not support ${type}`);
    }
  }
  return contiguousBytes;
}

/** Reassembles the encoded byte streams into ordinary contiguous physical values. */
function decodeContiguousBytes(
  cursor: CursorBuffer,
  count: number,
  byteWidth: number,
  output?: Uint8Array
): Uint8Array {
  const encodedByteLength = count * byteWidth;
  const cursorEnd = cursor.offset + encodedByteLength;
  if (cursorEnd > (cursor.size ?? cursor.buffer.length)) {
    throw new Error(
      `Invalid BYTE_STREAM_SPLIT payload: expected ${encodedByteLength} bytes, received ${Math.max(0, (cursor.size ?? cursor.buffer.length) - cursor.offset)}`
    );
  }

  const contiguousBytes = output || new Uint8Array(encodedByteLength);
  for (let byteIndex = 0; byteIndex < byteWidth; byteIndex++) {
    const streamOffset = cursor.offset + byteIndex * count;
    for (let valueIndex = 0; valueIndex < count; valueIndex++) {
      contiguousBytes[valueIndex * byteWidth + byteIndex] =
        cursor.buffer[streamOffset + valueIndex];
    }
  }
  cursor.offset = cursorEnd;
  return contiguousBytes;
}

/** Returns a direct little-endian byte view for a compatible typed column destination. */
function getDirectOutputBytes(
  type: PrimitiveType,
  output: ParquetValueBuffer,
  outputOffset: number,
  count: number,
  int64AsBigInt: boolean | undefined
): Uint8Array | undefined {
  if (!IS_LITTLE_ENDIAN) {
    return undefined;
  }
  const outputMatchesType =
    (type === 'INT32' && output instanceof Int32Array) ||
    (type === 'INT64' && int64AsBigInt && output instanceof BigInt64Array) ||
    (type === 'FLOAT' && output instanceof Float32Array) ||
    (type === 'DOUBLE' && output instanceof Float64Array);
  if (!outputMatchesType) {
    return undefined;
  }
  const bytesPerElement = (output as Exclude<ParquetValueBuffer, unknown[]>).BYTES_PER_ELEMENT;
  return new Uint8Array(
    output.buffer,
    output.byteOffset + outputOffset * bytesPerElement,
    count * bytesPerElement
  );
}
