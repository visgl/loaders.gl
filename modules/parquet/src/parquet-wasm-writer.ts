// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WriterWithEncoder} from '@loaders.gl/loader-utils';
import type {ArrowTable} from '@loaders.gl/arrow';
import {encode} from './lib/wasm/encode-parquet-wasm';
import type {WriterOptions} from '@loaders.gl/loader-utils';

import {VERSION, PARQUET_WASM_URL} from './lib/constants';

export type ParquetWriterOptions = WriterOptions & {
  parquet?: {
    wasmUrl?: string;
  };
};

/** Parquet WASM writer */
export const ParquetWasmWriter: WriterWithEncoder<ArrowTable, never, ParquetWriterOptions> = {
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
};
