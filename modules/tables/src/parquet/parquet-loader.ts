// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser, LoaderContext} from '@loaders.gl/core/loader-utils';
import {BlobFile, concatenateArrayBuffersAsync} from '@loaders.gl/core/loader-utils';
import type {
  ObjectRowTable,
  ObjectRowTableBatch,
  ArrowTable,
  ArrowTableBatch
} from '@loaders.gl/core/schema';
import type {ReadableFile} from '@loaders.gl/core/loader-utils';

import {
  convertArrowBatchToObjectRows,
  convertArrowTableToObjectRows
} from './lib/parsers/convert-parquet-tables';
import {
  parseParquetFileToArrowWithJs,
  parseParquetFileToArrowInBatchesWithJs
} from './lib/parsers/parse-parquet-to-arrow-js';
import {normalizeParquetOptions} from './lib/utils/normalize-parquet-options';
import {
  deserializeParquetWorkerResult,
  serializeParquetWorkerResult
} from './lib/parquet-worker-transport';
import {ParquetLoader as ParquetLoaderMetadata} from './parquet-loader-types';
import type {ParquetLoaderOptions} from './parquet-loader-options';

export type {ParquetLoaderOptions} from './parquet-loader-options';

const {preload: _ParquetLoaderPreload, ...ParquetLoaderMetadataWithoutPreload} =
  ParquetLoaderMetadata;

/** TypeScript-backed Parquet table loader supporting object-row and Arrow table output. */
export const ParquetLoaderWithParser = {
  ...ParquetLoaderMetadataWithoutPreload,
  parse(arrayBuffer: ArrayBuffer, options?: ParquetLoaderOptions, context?: LoaderContext) {
    return parseParquetTable(new BlobFile(arrayBuffer), options, context);
  },
  parseFile(file, options?: ParquetLoaderOptions, context?: LoaderContext) {
    return parseParquetTable(file, options, context);
  },
  parseFileInBatches(file, options?: ParquetLoaderOptions, context?: LoaderContext) {
    return parseParquetTableInBatches(file, options, context);
  },
  async *parseInBatches(
    asyncIterator:
      | AsyncIterable<ArrayBufferLike | ArrayBufferView>
      | Iterable<ArrayBufferLike | ArrayBufferView>,
    options?: ParquetLoaderOptions,
    context?: LoaderContext
  ) {
    const arrayBuffer = await concatenateArrayBuffersAsync(asyncIterator);
    yield* parseParquetTableInBatches(new BlobFile(arrayBuffer), options, context);
  },
  serializeWorkerResult: serializeParquetWorkerResult,
  deserializeWorkerResult: deserializeParquetWorkerResult
} as const satisfies LoaderWithParser<
  ObjectRowTable | ArrowTable,
  ObjectRowTableBatch | ArrowTableBatch,
  ParquetLoaderOptions
>;

/**
 * Parses a Parquet file using the canonical TypeScript-backed table loader.
 * @param file readable file abstraction
 * @param options optional loader options
 * @param context Loader cancellation context
 * @returns object-row or Arrow table output depending on `parquet.shape`
 */
async function parseParquetTable(
  file: BlobFile | ReadableFile,
  options?: ParquetLoaderOptions,
  context?: LoaderContext
): Promise<ObjectRowTable | ArrowTable> {
  const parquetOptions = getParquetOptions({
    ...options,
    signal: options?.signal || context?.signal
  });

  if (parquetOptions.parquet?.shape === 'arrow-table') {
    return await parseParquetFileToArrowWithJs(file, parquetOptions);
  }

  const arrowTable = await parseParquetFileToArrowWithJs(file, parquetOptions);
  return convertArrowTableToObjectRows(arrowTable);
}

/**
 * Parses a Parquet file into streamed table batches using the canonical TypeScript-backed loader.
 * @param file readable file abstraction
 * @param options optional loader options
 * @param context Loader progress and cancellation context
 * @returns async iterable of object-row or Arrow batches
 */
async function* parseParquetTableInBatches(
  file: BlobFile | ReadableFile,
  options?: ParquetLoaderOptions,
  context?: LoaderContext
): AsyncIterable<ObjectRowTableBatch | ArrowTableBatch> {
  const parquetOptions = getParquetOptions({
    ...options,
    signal: options?.signal || context?.signal
  });

  const reportProgress = context?.reportProgress || options?.onProgress;
  let completed = 0;
  reportProgress?.({phase: 'decode', completed, unit: 'rows'});
  for await (const batch of parseParquetFileToArrowInBatchesWithJs(file, parquetOptions)) {
    (options?.signal || context?.signal || options?.parquet?.signal)?.throwIfAborted();
    completed += batch.data.numRows;
    reportProgress?.({phase: 'decode', completed, unit: 'rows'});
    yield parquetOptions.parquet?.shape === 'arrow-table'
      ? batch
      : convertArrowBatchToObjectRows(batch);
  }
}

/**
 * Normalizes caller options for the canonical TypeScript-backed Parquet loaders.
 * @param options caller-supplied loader options
 * @returns normalized loader options
 */
export function getParquetOptions(options?: ParquetLoaderOptions): ParquetLoaderOptions {
  const normalizedOptions = normalizeParquetOptions(
    options,
    ParquetLoaderWithParser.options.parquet
  );
  if (options?.signal)
    normalizedOptions.parquet = {...normalizedOptions.parquet, signal: options.signal};
  return normalizedOptions;
}
