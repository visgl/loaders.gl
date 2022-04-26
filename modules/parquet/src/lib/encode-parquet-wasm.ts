import type {Table} from 'apache-arrow';

import {writeParquet, WriterPropertiesBuilder} from 'parquet-wasm';
import {RecordBatchStreamWriter} from 'apache-arrow';

/**
 * Encode Arrow Table to Parquet buffer
 */
export async function encode(table: Table): Promise<ArrayBuffer> {
  const arrowIPCBytes = tableToIPC(table);
  // TODO: provide options for how to write table.
  const writerProperties = new WriterPropertiesBuilder().build();
  const parquetBytes = writeParquet(arrowIPCBytes, writerProperties);
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
  return RecordBatchStreamWriter.writeAll(table).toUint8Array(true);
}
