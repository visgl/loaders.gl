// eslint-disable
import type {Table} from 'apache-arrow';

import {readParquet} from 'parquet-wasm/node';
import {tableFromIPC} from 'apache-arrow';

export function parseParquet(arrayBuffer: ArrayBuffer, options): Table {
  const arr = new Uint8Array(arrayBuffer);
  const arrowIPCBytes = readParquet(arr);
  const arrowTable = tableFromIPC(arrowIPCBytes);
  return arrowTable;
}
