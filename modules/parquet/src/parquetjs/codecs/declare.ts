// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Copyright (c) 2017 ironSource Ltd.
// Forked from https://github.com/kbajalc/parquets under MIT license

import {PrimitiveType} from '../schema/declare';

/** Mutable destination accepted by Parquet value decoders. */
export type ParquetValueBuffer =
  | unknown[]
  | Uint8Array
  | Uint16Array
  | Uint32Array
  | Int32Array
  | BigInt64Array
  | Float32Array
  | Float64Array;

/** Mutable Arrow-compatible destination for compact physical BYTE_ARRAY values. */
export type ParquetByteArrayOutput = {
  /** Contiguous bytes copied from decoded physical values. */
  data: Uint8Array;
  /** Arrow-compatible offsets for compact non-null physical values. */
  valueOffsets: Int32Array;
  /** Number of bytes written to `data`. */
  byteLength: number;
};

/** Ensures a compact byte destination can accept an additional physical value. */
export function reserveParquetByteArrayOutput(
  output: ParquetByteArrayOutput,
  additionalByteLength: number
): void {
  const requiredByteLength = output.byteLength + additionalByteLength;
  if (requiredByteLength <= output.data.byteLength) return;
  const nextByteLength = Math.max(requiredByteLength, output.data.byteLength * 2, 1024);
  const data = new Uint8Array(nextByteLength);
  data.set(output.data.subarray(0, output.byteLength));
  output.data = data;
}

export interface CursorBuffer {
  buffer: Uint8Array;
  offset: number;
  size?: number;
}

export interface ParquetCodecOptions {
  bitWidth?: number;
  disableEnvelope?: boolean;
  /** Retain byte arrays as views into the decoded page buffer. */
  retainByteArrayViews?: boolean;
  typeLength?: number;
  /** Optional destination that lets a codec avoid allocating a page-local values array. */
  output?: ParquetValueBuffer;
  /** First element in `output` written by the codec. */
  outputOffset?: number;
  /** Optional dictionary resolved while decoding dictionary indices. */
  dictionary?: readonly unknown[];
  /** Optional compact destination used by PLAIN BYTE_ARRAY decoding. */
  byteArrayOutput?: ParquetByteArrayOutput;
  /** Preserve decoded INT64 values as bigint instead of converting them to number. */
  int64AsBigInt?: boolean;
  /** Decode legacy INT96 physical values as epoch nanoseconds instead of raw numbers. */
  int96AsTimestamp?: boolean;
}

export interface ParquetCodecKit {
  encodeValues(type: PrimitiveType, values: any[], opts?: ParquetCodecOptions): Uint8Array;
  decodeValues(
    type: PrimitiveType,
    cursor: CursorBuffer,
    count: number,
    opts: ParquetCodecOptions
  ): ParquetValueBuffer;
}

/** Allocates a page-local output or returns the caller-provided column destination. */
export function getParquetValueOutput(
  options: ParquetCodecOptions,
  count: number
): {output: ParquetValueBuffer; outputOffset: number} {
  return {
    output: options.output || new Array<unknown>(count),
    outputOffset: options.outputOffset || 0
  };
}
