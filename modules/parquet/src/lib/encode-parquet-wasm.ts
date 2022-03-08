import type {Table} from 'apache-arrow';

import {writeParquet} from 'parquet-wasm/node';
import {tableToIPC} from 'apache-arrow';

/**
 * Encode Arrow Table to Parquet buffer
 */
export function encodeSync(table: Table): ArrayBuffer {
  const arrowIPCBytes = tableToIPC(table, 'file');
  const parquetBytes = writeParquet(arrowIPCBytes);
  return parquetBytes.buffer.slice(
    parquetBytes.byteOffset,
    parquetBytes.byteLength + parquetBytes.byteOffset
  );
}
