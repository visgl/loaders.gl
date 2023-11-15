// loaders.gl, MIT license
// Copyright (c) vis.gl contributors

import type {WriterWithEncoder} from '@loaders.gl/loader-utils';
import type {ArrowTable} from '@loaders.gl/arrow';
import {encode, ParquetWriterOptions} from './lib/wasm/encode-parquet-wasm';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

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
      wasmUrl: 'https://unpkg.com/parquet-wasm@0.3.1/esm2/arrow1_bg.wasm'
    }
  },
  encode
};
