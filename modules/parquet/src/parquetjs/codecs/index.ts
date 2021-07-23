// Forked from https://github.com/kbajalc/parquets under MIT license (Copyright (c) 2017 ironSource Ltd.)
import type {ParquetCodec} from '../schema/declare';
import type {ParquetCodecKit} from './declare';
import * as PLAIN from './plain';
import * as RLE from './rle';
import * as PLAIN_DICTIONARY from './plain-dictionary';

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
  PLAIN_DICTIONARY: {
    // @ts-ignore
    encodeValues: PLAIN_DICTIONARY.encodeValues,
    decodeValues: PLAIN_DICTIONARY.decodeValues
  }
};
