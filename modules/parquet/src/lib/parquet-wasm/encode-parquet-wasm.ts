import type {Table} from 'apache-arrow';
import type {WriterOptions} from '@loaders.gl/loader-utils';

import {RecordBatchStreamWriter} from 'apache-arrow';
import {loadWasm} from './load-wasm';

export type ParquetWriterOptions = WriterOptions & {
  parquet?: {
    wasmUrl?: string;
  };
};

/**
 * Encode Arrow Table to Parquet buffer
 */
export async function encode(table: Table, options?: ParquetWriterOptions): Promise<ArrayBuffer> {
  const wasmUrl = options?.parquet?.wasmUrl;
  const wasm = await loadWasm(wasmUrl);

  const arrowIPCBytes = tableToIPC(table);
  // TODO: provide options for how to write table.
  const writerProperties = new wasm.WriterPropertiesBuilder().build();
  const parquetBytes = wasm.writeParquet(arrowIPCBytes, writerProperties);
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
