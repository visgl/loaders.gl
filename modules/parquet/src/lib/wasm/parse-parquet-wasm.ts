// eslint-disable
import type {LoaderOptions} from '@loaders.gl/loader-utils';
import * as arrow from 'apache-arrow';
import {loadWasm} from './load-wasm/load-wasm-node';

export type ParquetWasmLoaderOptions = LoaderOptions & {
  parquet?: {
    type?: 'arrow-table';
    wasmUrl?: string;
  };
};

export async function parseParquetWasm(
  arrayBuffer: ArrayBuffer,
  options?: ParquetWasmLoaderOptions
): Promise<arrow.Table> {
  const wasmUrl = options?.parquet?.wasmUrl;
  const wasm = await loadWasm(wasmUrl);

  const arr = new Uint8Array(arrayBuffer);
  const arrowIPCUint8Arr = wasm.readParquet(arr);
  const arrowIPCBuffer = arrowIPCUint8Arr.buffer.slice(
    arrowIPCUint8Arr.byteOffset,
    arrowIPCUint8Arr.byteLength + arrowIPCUint8Arr.byteOffset
  );
  const arrowTable = tableFromIPC(arrowIPCBuffer);
  return arrowTable;
}

/**
 * Deserialize the IPC format into a {@link Table}. This function is a
 * convenience wrapper for {@link RecordBatchReader}. Opposite of {@link tableToIPC}.
 */
function tableFromIPC(input: ArrayBuffer): arrow.Table {
  const reader = arrow.RecordBatchStreamReader.from(input);
  const recordBatches: arrow.RecordBatch[] = [];
  for (const recordBatch of reader) {
    recordBatches.push(recordBatch);
  }
  return new arrow.Table(recordBatches);
}
