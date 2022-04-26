// eslint-disable
import type {RecordBatch} from 'apache-arrow';
import {Table, RecordBatchStreamReader} from 'apache-arrow';
import {loadWasm} from './load-wasm/load-wasm-node';

export async function parseParquet(arrayBuffer: ArrayBuffer, options): Promise<Table> {
  const wasm = await loadWasm();

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
function tableFromIPC(input: ArrayBuffer): Table {
  const reader = RecordBatchStreamReader.from(input);
  const recordBatches: RecordBatch[] = [];
  for (const recordBatch of reader) {
    recordBatches.push(recordBatch);
  }
  return new Table(recordBatches);
}
