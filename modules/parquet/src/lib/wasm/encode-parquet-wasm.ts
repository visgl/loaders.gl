import type {WriterOptions} from '@loaders.gl/loader-utils';
import type {ArrowTable} from '@loaders.gl/arrow';

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
  table: ArrowTable,
  options?: ParquetWriterOptions
): Promise<ArrayBuffer> {
  const wasmUrl = options?.parquet?.wasmUrl;
  const wasm = await loadWasm(wasmUrl);

  const arrowTable: arrow.Table = table.data;

  // Serialize a table to the IPC format.
  const writer = arrow.RecordBatchStreamWriter.writeAll(arrowTable);
  const arrowIPCBytes = writer.toUint8Array(true);

  // TODO: provide options for how to write table.
  const writerProperties = new wasm.WriterPropertiesBuilder().build();
  const parquetBytes = wasm.writeParquet(arrowIPCBytes, writerProperties);
  return parquetBytes.buffer.slice(
    parquetBytes.byteOffset,
    parquetBytes.byteLength + parquetBytes.byteOffset
  );
}
