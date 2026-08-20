// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Copyright (c) 2017 ironSource Ltd.
// Forked from https://github.com/kbajalc/parquets under MIT license

import {decodeValues as decodeRleValues} from './rle';
import {encodeValues as encodeRleValues} from './rle';
import type {PrimitiveType} from '../schema/declare';
import type {ParquetCodecOptions} from './declare';

export function decodeValues(type, cursor, count, opts) {
  const bitWidth = cursor.buffer[cursor.offset];
  cursor.offset += 1;
  return decodeRleValues(type, cursor, count, {...opts, bitWidth, disableEnvelope: true});
}

/** Encodes dictionary indexes as a bit width followed by the RLE/bit-packed hybrid stream. */
export function encodeValues(
  _type: PrimitiveType,
  values: number[],
  options: ParquetCodecOptions
): Uint8Array {
  if (options.bitWidth === undefined) {
    throw new Error('bitWidth is required for dictionary encoding');
  }
  const encodedIndices = encodeRleValues('INT32', values, {
    bitWidth: options.bitWidth,
    disableEnvelope: true
  });
  const output = new Uint8Array(encodedIndices.length + 1);
  output[0] = options.bitWidth;
  output.set(encodedIndices, 1);
  return output;
}
