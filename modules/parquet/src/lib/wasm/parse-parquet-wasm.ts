// eslint-disable
import type {LoaderOptions} from '@loaders.gl/loader-utils';
import type {ArrowTable} from '@loaders.gl/arrow';
import {serializeArrowSchema} from '@loaders.gl/arrow';
import * as arrow from 'apache-arrow';
import {loadWasm} from './load-wasm';

export type ParquetWasmLoaderOptions = LoaderOptions & {
  parquet?: {
    type?: 'arrow-table';
    wasmUrl?: string;
  };
};

export async function parseParquetWasm(
  arrayBuffer: ArrayBuffer,
  options?: ParquetWasmLoaderOptions
): Promise<ArrowTable> {
  const wasmUrl = options?.parquet?.wasmUrl;
  const wasm = await loadWasm(wasmUrl);

  const arr = new Uint8Array(arrayBuffer);
  const arrowIPCUint8Arr = wasm.readParquet(arr);
  const arrowIPCBuffer = arrowIPCUint8Arr.buffer.slice(
    arrowIPCUint8Arr.byteOffset,
    arrowIPCUint8Arr.byteLength + arrowIPCUint8Arr.byteOffset
  );

  const reader = arrow.RecordBatchStreamReader.from(arrowIPCBuffer);
  const recordBatches: arrow.RecordBatch[] = [];
  for (const recordBatch of reader) {
    recordBatches.push(recordBatch);
  }
  const arrowTable = new arrow.Table(recordBatches);

  return {
    shape: 'arrow-table',
    schema: serializeArrowSchema(arrowTable.schema),
    data: arrowTable
  };
}
