// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type * as ParquetWasm from 'parquet-wasm/esm/parquet_wasm.js';
import {loadNodeWasmInput} from './load-wasm-node';

let initializePromise: Promise<typeof ParquetWasm> | undefined;

export async function loadWasm(
  wasmUrl?: ParquetWasm.InitInput | Promise<ParquetWasm.InitInput>
): Promise<typeof ParquetWasm> {
  if (!initializePromise) {
    const nextInitializePromise = loadAndInitializeWasm(wasmUrl);
    const cachedInitializePromise = nextInitializePromise.catch(error => {
      if (initializePromise === cachedInitializePromise) {
        initializePromise = undefined;
      }
      throw error;
    });
    initializePromise = cachedInitializePromise;
  }

  return await initializePromise;
}

async function loadAndInitializeWasm(
  wasmUrl?: ParquetWasm.InitInput | Promise<ParquetWasm.InitInput>
): Promise<typeof ParquetWasm> {
  const parquetWasm = await import('parquet-wasm/esm/parquet_wasm.js');
  const moduleOrPath = wasmUrl ? await wasmUrl : await loadDefaultWasmInput();
  if (moduleOrPath) {
    await parquetWasm.default({module_or_path: moduleOrPath});
  } else {
    // parquet-wasm resolves its sibling asset with new URL(..., import.meta.url), which allows
    // browser bundlers to copy and fingerprint the WASM file without a network CDN default.
    await parquetWasm.default();
  }
  return parquetWasm;
}

/** Loads a local Node asset or defers to parquet-wasm's browser import.meta resolver. */
async function loadDefaultWasmInput(): Promise<Uint8Array | undefined> {
  return await loadNodeWasmInput();
}
