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

/** Public options for the wasm-backed Arrow-first Parquet writer. */
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
    options = normalizeParquetOptions(options, ParquetArrowWriter.options.parquet);
    return encodeArrowToParquet(ensureGeoParquetMetadataOnArrowTable(arrowTable), options);
  }
} as const satisfies WriterWithEncoder<ArrowTable, never, ParquetArrowWriterOptions>;
