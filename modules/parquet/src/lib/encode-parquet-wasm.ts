import type {Table} from 'apache-arrow';

import {writeParquet} from 'parquet-wasm/node';
import {RecordBatchFileWriter} from 'apache-arrow';

/**
 * Encode Arrow Table to Parquet buffer
 */
export function encodeSync(table: Table): ArrayBuffer {
  const arrowIPCBytes = tableToIPC(table);
  const parquetBytes = writeParquet(arrowIPCBytes);
  return parquetBytes.buffer.slice(
    parquetBytes.byteOffset,
    parquetBytes.byteLength + parquetBytes.byteOffset
  );
}

/**
 * Serialize a {@link Table} to the IPC format. This function is a convenience
 * wrapper for {@link RecordBatchStreamWriter} and {@link RecordBatchFileWriter}.
 * Opposite of {@link tableFromIPC}.
 *
 * @param table The Table to serialize.
 * @param type Whether to serialize the Table as a file or a stream.
 */
export function tableToIPC(table: Table): Uint8Array {
  return RecordBatchFileWriter.writeAll(table).toUint8Array(true);
}
