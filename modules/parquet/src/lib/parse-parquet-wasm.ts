// eslint-disable
import {readParquet} from 'parquet-wasm/node';
import type {RecordBatch} from 'apache-arrow';
import {Table, RecordBatchStreamReader} from 'apache-arrow';

export function parseParquet(arrayBuffer: ArrayBuffer, options): Table {
  const arr = new Uint8Array(arrayBuffer);
  const arrowIPCUint8Arr = readParquet(arr);
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
function tableFromIPC(input: ArrayBuffer): Table {
  const reader = RecordBatchStreamReader.from(input);
  const recordBatches: RecordBatch[] = [];
  for (const recordBatch of reader) {
    recordBatches.push(recordBatch);
  }
  return new Table(recordBatches);
}
