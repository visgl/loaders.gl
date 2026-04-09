// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Copyright (c) 2017 ironSource Ltd.
// Forked from https://github.com/kbajalc/parquets under MIT license

import {PrimitiveType} from '../schema/declare';

export interface CursorBuffer {
  buffer: Uint8Array;
  offset: number;
  size?: number;
}

export interface ParquetCodecOptions {
  bitWidth?: number;
  disableEnvelope?: boolean;
  typeLength?: number;
}

export interface ParquetCodecKit {
  encodeValues(type: PrimitiveType, values: any[], opts?: ParquetCodecOptions): Uint8Array;
  decodeValues(
    type: PrimitiveType,
    cursor: CursorBuffer,
    count: number,
    opts: ParquetCodecOptions
  ): any[];
}
