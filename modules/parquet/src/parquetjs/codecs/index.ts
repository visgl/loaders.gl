// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Copyright (c) 2017 ironSource Ltd.
// Forked from https://github.com/kbajalc/parquets under MIT license

import type {ParquetCodec} from '../schema/declare';
import type {ParquetCodecKit} from './declare';
import * as PLAIN from './plain';
import * as RLE from './rle';
import * as DICTIONARY from './dictionary';
import * as DELTA from './delta';
import * as BYTE_STREAM_SPLIT from './byte-stream-split';

export * from './declare';

export const PARQUET_CODECS: Record<ParquetCodec, ParquetCodecKit> = {
  PLAIN: {
    encodeValues: PLAIN.encodeValues,
    decodeValues: PLAIN.decodeValues
  },
  RLE: {
    encodeValues: RLE.encodeValues,
    decodeValues: RLE.decodeValues
  },
  BIT_PACKED: {
    encodeValues: RLE.encodeBitPackedValues,
    decodeValues: RLE.decodeBitPackedValues
  },
  // Using the PLAIN_DICTIONARY enum value is deprecated in the Parquet 2.0 specification.
  PLAIN_DICTIONARY: {
    // @ts-ignore
    encodeValues: DICTIONARY.encodeValues,
    decodeValues: DICTIONARY.decodeValues
  },
  // Prefer using RLE_DICTIONARY in a data page and PLAIN in a dictionary page for Parquet 2.0+ files.
  RLE_DICTIONARY: {
    // @ts-ignore
    encodeValues: DICTIONARY.encodeValues,
    decodeValues: DICTIONARY.decodeValues
  },
  DELTA_BINARY_PACKED: {
    encodeValues: DELTA.encodeDeltaBinaryPackedValues,
    decodeValues: DELTA.decodeDeltaBinaryPackedValues
  },
  DELTA_LENGTH_BYTE_ARRAY: {
    encodeValues: DELTA.encodeDeltaLengthByteArrayValues,
    decodeValues: DELTA.decodeDeltaLengthByteArrayValues
  },
  DELTA_BYTE_ARRAY: {
    encodeValues: DELTA.encodeDeltaByteArrayValues,
    decodeValues: DELTA.decodeDeltaByteArrayValues
  },
  BYTE_STREAM_SPLIT: {
    encodeValues: BYTE_STREAM_SPLIT.encodeValues,
    decodeValues: BYTE_STREAM_SPLIT.decodeValues
  }
};
