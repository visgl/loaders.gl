// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Table, RecordBatch} from 'apache-arrow';
import {unwrapParquetBatches} from '../../../../modules/tables/src/parquet/lib/native-parquet-batches';
import type {LoaderWithParser} from '@loaders.gl/core/loader-utils';
import {BlobFile, concatenateArrayBuffersAsync} from '@loaders.gl/core/loader-utils';
import type {ObjectRowTable, ObjectRowTableBatch} from '@loaders.gl/core/schema';
import type {ReadableFile} from '@loaders.gl/core/loader-utils';

import {convertArrowToTable} from '@loaders.gl/core/schema-utils';
import {
  parseParquetFileToArrow,
  parseParquetFileToArrowInBatches
} from './parse-parquet-to-arrow';
import {convertParquetTableToRows} from '../../../../modules/tables/src/parquet/lib/parsers/parse-parquet-tables';
import {loadWasm} from '../../../../modules/tables/src/parquet/lib/utils/load-wasm';
import {tableFromIPC} from 'apache-arrow';
import {normalizeParquetOptions} from '../../../../modules/tables/src/parquet/lib/utils/normalize-parquet-options';
import {
  deserializeParquetWorkerResult,
  serializeParquetWorkerResult
} from '../../../../modules/tables/src/parquet/lib/parquet-worker-transport';
import {ParquetLoader as ParquetLoaderMetadata} from '../../../../modules/tables/src/parquet/parquet-loader-types';
import type {ParquetLoaderOptions} from '../../../../modules/tables/src/parquet/parquet-loader-options';

export type {ParquetLoaderOptions} from '../../../../modules/tables/src/parquet/parquet-loader-options';

const {preload: _ParquetLoaderPreload, ...ParquetLoaderMetadataWithoutPreload} =
  ParquetLoaderMetadata;

/** Decodes complete in-memory fixture bytes through parquet-wasm's atomic reader. */
export async function decodeParquetWasmFixture(
  arrayBuffer: ArrayBuffer,
  columns?: string[]
): Promise<Table> {
  const wasm = await loadWasm();
  const table = wasm.readParquet(new Uint8Array(arrayBuffer), {columns});
  return tableFromIPC(table.intoIPCStream());
}

/** WASM-backed Parquet table loader supporting object-row and Arrow table output. */
export const ParquetWasmLoaderWithParser = {
  ...ParquetLoaderMetadataWithoutPreload,
  worker: false,
  workerInBatches: false,
  /** Parses a complete Parquet payload with the optional WASM backend. */
  parse(arrayBuffer: ArrayBuffer, options?: ParquetLoaderOptions) {
    return parseParquetTable(new BlobFile(arrayBuffer), options);
  },
  /** Reads a random-access file with the optional WASM backend. */
  parseFile(file, options?: ParquetLoaderOptions) {
    return parseParquetTable(file, options);
  },
  /** Streams row batches from a random-access file. */
  parseFileInBatches(file, options?: ParquetLoaderOptions) {
    return parseParquetTableInBatches(file, options);
  },
  /** Collects input chunks before streaming decoded table batches. */
  async *parseInBatches(
    asyncIterator:
      | AsyncIterable<ArrayBufferLike | ArrayBufferView>
      | Iterable<ArrayBufferLike | ArrayBufferView>,
    options?: ParquetLoaderOptions,
    _context?: unknown
  ) {
    const arrayBuffer = await concatenateArrayBuffersAsync(asyncIterator);
    yield* parseParquetTableInBatches(new BlobFile(arrayBuffer), options);
  },
  serializeWorkerResult: serializeParquetWorkerResult,
  deserializeWorkerResult: deserializeParquetWorkerResult
} as const satisfies LoaderWithParser<
  ObjectRowTable | Table,
  ObjectRowTableBatch | RecordBatch,
  ParquetLoaderOptions
>;

/**
 * Parses a Parquet file using the canonical WASM-backed table loader.
 * @param file readable file abstraction
 * @param options optional loader options
 * @returns object-row or Arrow table output depending on `parquet.shape`
 */
async function parseParquetTable(
  file: BlobFile | ReadableFile,
  options?: ParquetLoaderOptions
): Promise<ObjectRowTable | Table> {
  const parquetOptions = getParquetOptions(options);

  if (parquetOptions.parquet?.shape === 'arrow') {
    return parseParquetFileToArrow(file, parquetOptions.parquet);
  }

  const arrowTable = await parseParquetFileToArrow(file, parquetOptions.parquet);
  return convertArrowToTable(arrowTable, 'object-row-table');
}

/**
 * Parses a Parquet file into streamed table batches using the canonical WASM-backed loader.
 * @param file readable file abstraction
 * @param options optional loader options
 * @returns async iterable of object-row or Arrow batches
 */
async function* parseParquetTableInBatches(
  file: BlobFile | ReadableFile,
  options?: ParquetLoaderOptions
): AsyncIterable<ObjectRowTableBatch | RecordBatch> {
  const parquetOptions = getParquetOptions(options);

  if (parquetOptions.parquet?.shape === 'arrow') {
    yield* unwrapParquetBatches(parseParquetFileToArrowInBatches(file, parquetOptions.parquet));
    return;
  }

  for await (const batch of parseParquetFileToArrowInBatches(file, parquetOptions.parquet)) {
    yield convertParquetTableToRows(batch);
  }
}

/**
 * Normalizes caller options for the canonical WASM-backed Parquet loaders.
 * @param options caller-supplied loader options
 * @returns normalized loader options
 */
export function getParquetOptions(options?: ParquetLoaderOptions): ParquetLoaderOptions {
  return normalizeParquetOptions(options, ParquetWasmLoaderWithParser.options.parquet);
}
