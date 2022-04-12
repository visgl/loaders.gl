import type {Table} from 'apache-arrow';

// import {writeParquet, WriterPropertiesBuilder} from 'parquet-wasm/esm/arrow1';
import {RecordBatchFileWriter} from 'apache-arrow';

/**
 * Encode Arrow Table to Parquet buffer
 */
export async function encode(table: Table): Promise<ArrayBuffer> {
  const module = await import('parquet-wasm/esm/arrow1');
  console.log('module', module);

  const {writeParquet, WriterPropertiesBuilder} = module;

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
  return RecordBatchFileWriter.writeAll(table).toUint8Array(true);
}
