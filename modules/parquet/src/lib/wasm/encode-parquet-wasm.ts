import type {Table} from 'apache-arrow';
import type {WriterOptions} from '@loaders.gl/loader-utils';

import {tableToIPC} from 'apache-arrow';
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

  const arrowIPCBytes = tableToIPC(table, 'stream');
  // TODO: provide options for how to write table.
  const writerProperties = new wasm.WriterPropertiesBuilder().build();
  const parquetBytes = wasm.writeParquet(arrowIPCBytes, writerProperties);
  return parquetBytes.buffer.slice(
    parquetBytes.byteOffset,
    parquetBytes.byteLength + parquetBytes.byteOffset
  );
}
