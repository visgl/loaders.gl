// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type * as ParquetWasm from 'parquet-wasm/esm/parquet_wasm.js';
import {PARQUET_WASM_URL} from '../constants';

let initializePromise: Promise<typeof ParquetWasm>;

export async function loadWasm(
  wasmUrl: ParquetWasm.InitInput | Promise<ParquetWasm.InitInput> = PARQUET_WASM_URL
): Promise<typeof ParquetWasm> {
  if (!initializePromise) {
    if (!wasmUrl) {
      throw new Error('ParquetLoader: No wasmUrl provided');
    }
    initializePromise = loadAndInitializeWasm(wasmUrl);
  }

  return await initializePromise;
}

async function loadAndInitializeWasm(
  wasmUrl: ParquetWasm.InitInput | Promise<ParquetWasm.InitInput>
): Promise<typeof ParquetWasm> {
  const parquetWasm = await import('parquet-wasm/esm/parquet_wasm.js');
  await parquetWasm.default({module_or_path: wasmUrl});
  return parquetWasm;
}
