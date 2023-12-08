// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as wasmEsm from 'parquet-wasm/esm2/arrow1';

let cached: typeof wasmEsm | null = null;

export async function loadWasm(wasmUrl?: string) {
  if (cached !== null) {
    return cached;
  }

  // For ESM bundles, need to await the default export, which loads the WASM
  await wasmEsm.default(wasmUrl);
  cached = wasmEsm;

  return wasmEsm;
}
