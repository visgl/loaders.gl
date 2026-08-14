// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createLoaderWorker} from '@loaders.gl/loader-utils';
import type {ParquetLoaderOptions} from '../parquet-loader-options';
import {ParquetLoaderWithParser} from '../parquet-loader';

/** Worker-local Parquet loader with a package-relative default WASM URL. */
const ParquetWorkerLoader = {
  ...ParquetLoaderWithParser,
  parse(arrayBuffer: ArrayBuffer, options?: ParquetLoaderOptions) {
    return ParquetLoaderWithParser.parse(arrayBuffer, addWorkerWasmUrl(options));
  }
};

/** Adds the package-local WASM asset URL when the caller did not provide one. */
function addWorkerWasmUrl(options?: ParquetLoaderOptions): ParquetLoaderOptions | undefined {
  if (options?.parquet?.wasmUrl || typeof globalThis.location?.href !== 'string') {
    return options;
  }
  return {
    ...options,
    parquet: {
      ...options?.parquet,
      wasmUrl: new URL('parquet_wasm_bg.wasm', globalThis.location.href).toString()
    }
  };
}

createLoaderWorker(ParquetWorkerLoader);
