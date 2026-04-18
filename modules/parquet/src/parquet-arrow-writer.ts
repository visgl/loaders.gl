// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WriterWithEncoder, WriterOptions} from '@loaders.gl/loader-utils';
import type {ArrowTable} from '@loaders.gl/schema';
import {encodeArrowToParquet} from './lib/encoders/encode-arrow-to-parquet';
import {ensureGeoParquetMetadataOnArrowTable} from './lib/geo/geospatial-metadata';
import {normalizeParquetOptions} from './lib/utils/normalize-parquet-options';
import {ParquetFormat} from './parquet-format';

import {VERSION, PARQUET_WASM_URL} from './lib/constants';

export type ParquetArrowWriterOptions = WriterOptions & {
  parquet?: {
    wasmUrl?: string;
    implementation?: 'wasm' | 'js';
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
      wasmUrl: PARQUET_WASM_URL,
      implementation: 'wasm'
    }
  },
  encode(arrowTable: ArrowTable, options?: ParquetArrowWriterOptions) {
    options = normalizeParquetOptions(options, ParquetArrowWriter.options.parquet);
    if (options.parquet?.implementation === 'js') {
      throw new Error('ParquetArrowWriter: implementation "js" is not implemented yet');
    }
    return encodeArrowToParquet(ensureGeoParquetMetadataOnArrowTable(arrowTable), options);
  }
} as const satisfies WriterWithEncoder<ArrowTable, never, ParquetArrowWriterOptions>;
