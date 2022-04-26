import type {InitOutput} from 'parquet-wasm/esm2/arrow1';
import * as wasmEsm from 'parquet-wasm/esm2/arrow1';

let bundle: InitOutput | null = null;

export async function loadWasm(wasmUrl?: string) {
  if (bundle !== null) {
    return bundle;
  }

  bundle = await wasmEsm.default(wasmUrl);

  return wasmEsm;
}
