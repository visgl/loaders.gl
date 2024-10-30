// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WriterWithEncoder, WriterOptions} from '@loaders.gl/loader-utils';
import type {ArrowTable} from '@loaders.gl/schema';
import {encodeArrowToParquet} from './lib/encoders/encode-arrow-to-parquet';
import {ParquetFormat} from './parquet-format';

import {VERSION, PARQUET_WASM_URL} from './lib/constants';

export type ParquetArrowWriterOptions = WriterOptions & {
  parquet?: {
    wasmUrl?: string;
  };
};

/** Parquet WASM writer */
export const ParquetArrowWriter = {
  ...ParquetFormat,
  id: 'parquet-wasm',
  module: 'parquet',
  version: VERSION,
  options: {
    parquet: {
      wasmUrl: PARQUET_WASM_URL
    }
  },
  encode(arrowTable: ArrowTable, options?: ParquetArrowWriterOptions) {
    options = {parquet: {...ParquetArrowWriter.options.parquet, ...options?.parquet}, ...options};
    return encodeArrowToParquet(arrowTable, options);
  }
} as const satisfies WriterWithEncoder<ArrowTable, never, ParquetArrowWriterOptions>;
