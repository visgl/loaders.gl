// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// eslint-disable
import type {ReadableFile} from '@loaders.gl/loader-utils';
import type {ArrowTable, ArrowTableBatch, Schema} from '@loaders.gl/schema';
import {serializeArrowSchema} from '@loaders.gl/arrow';

import type * as parquetWasm from 'parquet-wasm';
import * as arrow from 'apache-arrow';

import {loadWasm} from '../utils/load-wasm';
import {makeStreamIterator} from '../utils/make-stream-iterator';

export async function parseParquetFileWasm(
  file: ReadableFile,
  options?: parquetWasm.ReaderOptions & {wasmUrl: string}
): Promise<ArrowTable> {
  const wasmUrl = options?.wasmUrl;

  const wasm = await loadWasm(wasmUrl);

  let parquetFile: parquetWasm.ParquetFile;
  if (file.handle instanceof Blob) {
    // TODO - let's assume fromFile() works on Blobs and not just on File...
    parquetFile = await wasm.ParquetFile.fromFile(file.handle as File);
  } else {
    parquetFile = await wasm.ParquetFile.fromUrl(file.url);
  }

  const wasmTable = await parquetFile.read(options);
  const ipcStream = wasmTable.intoIPCStream();
  const arrowTable = arrow.tableFromIPC(ipcStream);

  return {
    shape: 'arrow-table',
    schema: serializeArrowSchema(arrowTable.schema),
    data: arrowTable
  };
}

export async function* parseParquetFileInBatchesWasm(
  file: ReadableFile,
  options: parquetWasm.ReaderOptions & {wasmUrl: string}
): AsyncIterable<ArrowTableBatch> {
  const wasmUrl = options?.wasmUrl;

  const wasm = await loadWasm(wasmUrl);

  let parquetFile: parquetWasm.ParquetFile;
  if (file.handle instanceof Blob) {
    // Works on Blobs: https://kylebarron.dev/parquet-wasm/classes/esm_parquet_wasm.ParquetFile.html#fromFile
    parquetFile = await wasm.ParquetFile.fromFile(file.handle as File);
  } else {
    parquetFile = await wasm.ParquetFile.fromUrl(file.url);
  }

  const stream: ReadableStream<arrow.Table> = await parquetFile.stream(options);

  let schema: Schema;
  for await (const table of makeStreamIterator(stream)) {
    schema ||= serializeArrowSchema(table.schema);
    yield {
      batchType: 'data',
      shape: 'arrow-table',
      schema,
      data: table.batches[0],
      length: table.numRows
    };
  }
}
