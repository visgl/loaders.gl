import type {WriterOptions} from '@loaders.gl/loader-utils';

import * as arrow from 'apache-arrow';
import {loadWasm} from './load-wasm';

export type ParquetWriterOptions = WriterOptions & {
  parquet?: {
    wasmUrl?: string;
  };
};

/**
 * Encode Arrow arrow.Table to Parquet buffer
 */
export async function encode(
  table: arrow.Table,
  options?: ParquetWriterOptions
): Promise<ArrayBuffer> {
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
 * Serialize a table to the IPC format. This function is a convenience
 * Opposite of {@link tableFromIPC}.
 *
 * @param table The arrow.Table to serialize.
 * @param type Whether to serialize the arrow.Table as a file or a stream.
 */
export function tableToIPC(table: arrow.Table): Uint8Array {
  return arrow.RecordBatchStreamWriter.writeAll(table).toUint8Array(true);
}
