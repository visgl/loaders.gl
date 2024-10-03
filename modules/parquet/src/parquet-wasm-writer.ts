// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WriterWithEncoder, WriterOptions} from '@loaders.gl/loader-utils';
import type {ArrowTable} from '@loaders.gl/schema';
import {encode} from './lib/encoders/encode-parquet-wasm';

import {VERSION, PARQUET_WASM_URL} from './lib/constants';

export type ParquetWriterOptions = WriterOptions & {
  parquet?: {
    wasmUrl?: string;
  };
};

/** Parquet WASM writer */
export const ParquetWasmWriter = {
  name: 'Apache Parquet',
  id: 'parquet-wasm',
  module: 'parquet',
  version: VERSION,
  extensions: ['parquet'],
  mimeTypes: ['application/octet-stream'],
  binary: true,
  options: {
    parquet: {
      wasmUrl: PARQUET_WASM_URL
    }
  },
  encode(arrowTable: ArrowTable, options?: ParquetWriterOptions) {
    options = {parquet: {...ParquetWasmWriter.options.parquet, ...options?.parquet}, ...options};
    return encode(arrowTable, options);
  }
} as const satisfies WriterWithEncoder<ArrowTable, never, ParquetWriterOptions>;
