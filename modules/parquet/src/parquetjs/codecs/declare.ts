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
  | Int32Array
  | BigInt64Array
  | Float32Array
  | Float64Array;

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
  /** Preserve decoded INT64 values as bigint instead of converting them to number. */
  int64AsBigInt?: boolean;
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
