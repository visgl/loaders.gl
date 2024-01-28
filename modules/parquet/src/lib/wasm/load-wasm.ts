// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// eslint-disable-next-line import/default
import initWasm from 'parquet-wasm';
import * as parquetWasm from 'parquet-wasm';

let initializePromise: any;

export async function loadWasm(wasmUrl?: string) {
  if (!initializePromise && typeof initWasm === 'function') {
    if (!wasmUrl) {
      throw new Error('ParquetLoader: No wasmUrl provided');
    }
    // @ts-expect-error
    initializePromise = initWasm(wasmUrl);
  }
  await initializePromise;
  return parquetWasm;
}
