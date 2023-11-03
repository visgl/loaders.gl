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

  // Serialize a table to the IPC format.
  const writer = arrow.RecordBatchStreamWriter.writeAll(table);
  const arrowIPCBytes = writer.toUint8Array(true);

  // TODO: provide options for how to write table.
  const writerProperties = new wasm.WriterPropertiesBuilder().build();
  const parquetBytes = wasm.writeParquet(arrowIPCBytes, writerProperties);
  return parquetBytes.buffer.slice(
    parquetBytes.byteOffset,
    parquetBytes.byteLength + parquetBytes.byteOffset
  );
}
