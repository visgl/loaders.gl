// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// eslint-disable-next-line import/default
import initWasm from 'parquet-wasm/esm/arrow1';
import * as parquetWasm from 'parquet-wasm';
import {PARQUET_WASM_URL} from '../constants';

let initializePromise: any;

export async function loadWasm(wasmUrl: string = PARQUET_WASM_URL) {
  if (!initializePromise && typeof initWasm === 'function') {
    if (!wasmUrl) {
      throw new Error('ParquetLoader: No wasmUrl provided');
    }
    // @ts-ignore
    initializePromise = initWasm(wasmUrl);
  }
  await initializePromise;
  return parquetWasm;
}
