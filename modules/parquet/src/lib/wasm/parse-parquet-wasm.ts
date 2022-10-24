// eslint-disable
import type {LoaderOptions} from '@loaders.gl/loader-utils';
import {Table, tableFromIPC} from 'apache-arrow';
import {loadWasm} from './load-wasm/load-wasm-node';

export type ParquetLoaderOptions = LoaderOptions & {
  parquet?: {
    type?: 'arrow-table';
    wasmUrl?: string;
  };
};

export async function parseParquet(
  arrayBuffer: ArrayBuffer,
  options?: ParquetLoaderOptions
): Promise<Table> {
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
