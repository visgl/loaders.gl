// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// eslint-disable
import type {ReadableFile} from '@loaders.gl/loader-utils';
import type {ArrowTable, ArrowTableBatch, Schema} from '@loaders.gl/schema';
import {convertArrowToSchema} from '@loaders.gl/schema-utils';

import type * as parquetWasm from 'parquet-wasm/esm/parquet_wasm.js';
import * as arrow from 'apache-arrow';

import {loadWasm} from '../utils/load-wasm';
import {makeStreamIterator} from '../utils/make-stream-iterator';

type ParquetWasmReaderOptions = parquetWasm.ReaderOptions & {wasmUrl?: string};

export async function parseParquetFileToArrow(
  file: ReadableFile,
  options?: ParquetWasmReaderOptions
): Promise<ArrowTable> {
  const wasmUrl = options?.wasmUrl;
  const readerOptions = getReaderOptions(options);

  const wasm = await loadWasm(wasmUrl);

  const parquetFile = await createParquetFile(file, wasm);
  try {
    const wasmTable = await parquetFile.read(readerOptions);
    const ipcStream = wasmTable.intoIPCStream();
    const arrowTable = arrow.tableFromIPC(ipcStream);

    return {
      shape: 'arrow-table',
      schema: convertArrowToSchema(arrowTable.schema),
      data: arrowTable
    };
  } finally {
    parquetFile.free();
  }
}

export async function* parseParquetFileToArrowInBatches(
  file: ReadableFile,
  options: ParquetWasmReaderOptions
): AsyncIterable<ArrowTableBatch> {
  const wasmUrl = options?.wasmUrl;
  const readerOptions = getReaderOptions(options);

  const wasm = await loadWasm(wasmUrl);

  const parquetFile = await createParquetFile(file, wasm);
  try {
    const stream = await parquetFile.stream(readerOptions);

    let schema: Schema | undefined;
    for await (const wasmRecordBatch of makeStreamIterator<parquetWasm.RecordBatch>(stream)) {
      const arrowTable = arrow.tableFromIPC(wasmRecordBatch.intoIPCStream());
      schema ||= convertArrowToSchema(arrowTable.schema);
      yield {
        batchType: 'data',
        shape: 'arrow-table',
        schema,
        data: arrowTable,
        length: arrowTable.numRows
      };
    }
  } finally {
    parquetFile.free();
  }
}

async function createParquetFile(
  file: ReadableFile,
  wasm: typeof parquetWasm
): Promise<parquetWasm.ParquetFile> {
  if (file.handle instanceof Blob) {
    // Works on Blobs: https://kylebarron.dev/parquet-wasm/classes/esm_parquet_wasm.ParquetFile.html#fromFile
    return await wasm.ParquetFile.fromFile(file.handle as File);
  }

  return await wasm.ParquetFile.fromUrl(file.url);
}

function getReaderOptions(options?: ParquetWasmReaderOptions): parquetWasm.ReaderOptions {
  const {wasmUrl, ...readerOptions} = options || {};
  return readerOptions;
}
