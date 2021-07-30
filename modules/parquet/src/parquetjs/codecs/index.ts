// Forked from https://github.com/kbajalc/parquets under MIT license (Copyright (c) 2017 ironSource Ltd.)
import type {ParquetCodec} from '../schema/declare';
import type {ParquetCodecKit} from './declare';
import * as PLAIN from './plain';
import * as RLE from './rle';
import * as DICTIONARY from './plain-dictionary';

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
  }
};
