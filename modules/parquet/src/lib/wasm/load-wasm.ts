// export {loadWasm} from './load-wasm-node';

import {isBrowser} from '@loaders.gl/loader-utils';

const PARQUET_WASM_BROWSER = 'parquet-wasm/esm2/arrow1';
const PARQUET_WASM_NODE = 'parquet-wasm/node/arrow1';

let cached: any | null = null;

export async function loadWasm(wasmUrl?: string) {
  if (!cached !== null) {
    return cached;
  }

  const parquetWASM = isBrowser
    ? await import(PARQUET_WASM_BROWSER)
    : await import(PARQUET_WASM_NODE);
    
  // For ESM bundles, need to await the default export, which loads the WASM
  await parquetWASM.default(wasmUrl);
 
  cached = parquetWASM;

  return parquetWASM;
}
