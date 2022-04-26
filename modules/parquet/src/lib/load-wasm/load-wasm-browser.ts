import * as wasmEsm from 'parquet-wasm/esm2/arrow1';

export async function loadWasm(wasmUrl) {
  // Just for temporary testing in browser tests
  wasmUrl = wasmUrl || 'http://localhost:5000/node_modules/parquet-wasm/arrow1/esm_bg.wasm';
  await wasmEsm.default(wasmUrl);

  return wasmEsm;
}
