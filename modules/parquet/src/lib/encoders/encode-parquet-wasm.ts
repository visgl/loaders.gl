// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ArrowTable} from '@loaders.gl/arrow';

import * as arrow from 'apache-arrow';
import {loadWasm} from '../utils/load-wasm';

import type {ParquetWriterOptions} from '../../parquet-wasm-writer';

/**
 * Encode Arrow arrow.Table to Parquet buffer
 */
export async function encode(
  table: ArrowTable,
  options: ParquetWriterOptions
): Promise<ArrayBuffer> {
  const wasmUrl = options.parquet?.wasmUrl!;
  const wasm = await loadWasm(wasmUrl);

  // Serialize the table to the IPC format.
  const arrowTable: arrow.Table = table.data;
  const ipcStream = arrow.tableToIPC(arrowTable);

  // Pass the IPC stream to the Parquet writer.
  const wasmTable = wasm.Table.fromIPCStream(ipcStream);
  const wasmProperties = new wasm.WriterPropertiesBuilder().build();
  try {
    const parquetBytes = wasm.writeParquet(wasmTable, wasmProperties);
    // const parquetBytes = wasm.writeParquet(wasmTable, wasmProperties);
    return parquetBytes.buffer.slice(
      parquetBytes.byteOffset,
      parquetBytes.byteLength + parquetBytes.byteOffset
    );
  } finally {
    // wasmTable.free();
    // wasmProperties.free();
  }
}

// type WriteOptions = {
//   compression?: number;
//   dictionaryEnabled?: boolean;
//   encoding?: number;
//   maxRowGroupSize?: number;
//   maxStatisticsSize?: number;
//   statisticsEnabled?: boolean;
//   writeBatchSize?: number;
//   dataPageSizeLimit?: number;
//   dictionaryPageSizeLimit?: number;
// };

// columnCompression: Record<string, number>;
// columnDictionaryEnabled: Record<string, boolean>;
// columnEncoding: Record<string, number>;
// columnMaxStatisticsSize
// compression:Record<string, number>;
// setCreatedBy
// setDataPageSizeLimit
// setDictionaryEnabled
// setDictionaryPageSizeLimit
// setEncoding
// setMaxRowGroupSize
// setMaxStatisticsSize
// setStatisticsEnabled
// setWriteBatchSize
// setWriterVersion
