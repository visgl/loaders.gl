// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// eslint-disable
import type {ArrowTable} from '@loaders.gl/arrow';
import {serializeArrowSchema} from '@loaders.gl/arrow';
import type {ParquetWasmLoaderOptions} from '../../parquet-wasm-loader';
import {loadWasm} from './load-wasm';
import * as arrow from 'apache-arrow';

export async function parseParquetWasm(
  arrayBuffer: ArrayBuffer,
  options: ParquetWasmLoaderOptions
): Promise<ArrowTable> {
  const arr = new Uint8Array(arrayBuffer);

  const wasmUrl = options?.parquet?.wasmUrl;
  try {
    const wasm = await loadWasm(wasmUrl);
    const wasmTable = wasm.readParquet(arr);

    const ipcStream = wasmTable.intoIPCStream();
    const arrowTable = arrow.tableFromIPC(ipcStream);

    return {
      shape: 'arrow-table',
      schema: serializeArrowSchema(arrowTable.schema),
      data: arrowTable
    };
  } finally {
    // wasmTable.free();
  }
}
