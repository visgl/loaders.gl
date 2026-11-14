// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Table, RecordBatch} from 'apache-arrow';
import type {
  LoaderWithParser,
  LoaderContext,
  StrictLoaderOptions
} from '@loaders.gl/core/loader-utils';
import {
  BlobFile,
  concatenateArrayBuffersAsync,
  paceBatchIterator
} from '@loaders.gl/core/loader-utils';
import type {ObjectRowTable, ObjectRowTableBatch} from '@loaders.gl/core/schema';
import type {ReadableFile} from '@loaders.gl/core/loader-utils';

import {
  convertArrowTable,
  convertArrowTableBatch,
  makeArrowMetadataBatch
} from '@loaders.gl/core/schema-utils';
import {
  parseParquetFileToArrowWithJs,
  parseParquetFileToArrowInBatchesWithJs
} from './lib/parsers/parse-parquet-to-arrow-js';
import {normalizeParquetOptions} from './lib/utils/normalize-parquet-options';
import {
  convertParquetBatchToRows,
  deserializeParquetWorkerBatch,
  deserializeParquetWorkerResult,
  serializeParquetWorkerResult
} from './lib/parquet-worker-transport';
import {ParquetLoader as ParquetLoaderMetadata} from './parquet-loader-types';
import type {ParquetLoaderOptions} from './parquet-loader-options';

export type {ParquetLoaderOptions} from './parquet-loader-options';

const {preload: _ParquetLoaderPreload, ...ParquetLoaderMetadataWithoutPreload} =
  ParquetLoaderMetadata;

/** Selects Arrow decoding when the core caller requests object rows. */
function getArrowDecodeOptions(options: StrictLoaderOptions): StrictLoaderOptions | null {
  const parquet = options.parquet as ParquetLoaderOptions['parquet'];
  return parquet?.shape === 'object-row-table'
    ? {...options, parquet: {...parquet, shape: 'arrow'}}
    : null;
}

/** TypeScript-backed Parquet table loader supporting object-row and Arrow table output. */
export const ParquetLoaderWithParser = {
  ...ParquetLoaderMetadataWithoutPreload,
  /** Decodes Arrow for core object-row requests and materializes rows at the caller boundary. */
  prepareParseOutput(options: StrictLoaderOptions) {
    const decodeOptions = getArrowDecodeOptions(options);
    if (!decodeOptions) {
      return null;
    }
    return {
      options: decodeOptions,
      convert(table: Table | ObjectRowTable) {
        if ('shape' in table) {
          throw new Error('Parquet object-row conversion requires Arrow table output');
        }
        return convertArrowTable({shape: 'arrow-table', data: table}, 'object-row-table');
      }
    };
  },
  /** Materializes each Arrow batch when the core caller consumes it. */
  prepareParseBatchOutput(options: StrictLoaderOptions) {
    const decodeOptions = getArrowDecodeOptions(options);
    if (!decodeOptions) {
      return null;
    }
    return {
      options: decodeOptions,
      convert(batch: RecordBatch | ObjectRowTableBatch) {
        if ('shape' in batch) {
          throw new Error('Parquet object-row conversion requires Arrow batch output');
        }
        return convertParquetBatchToRows(batch);
      }
    };
  },
  parse(arrayBuffer: ArrayBuffer, options?: ParquetLoaderOptions, context?: LoaderContext) {
    return parseParquetTable(new BlobFile(arrayBuffer), options, context);
  },
  parseFile(file, options?: ParquetLoaderOptions, context?: LoaderContext) {
    return parseParquetTable(file, options, context);
  },
  parseFileInBatches(file, options?: ParquetLoaderOptions, context?: LoaderContext) {
    return paceBatchIterator(parseParquetTableInBatches(file, options, context), {
      batchMaxRowsPerSecond: options?.core?.batchMaxRowsPerSecond,
      getRowCount: batch => ('shape' in batch ? batch.length : batch.numRows),
      signal: options?.signal ?? context?.signal ?? options?.parquet?.signal
    });
  },
  async *parseInBatches(
    asyncIterator:
      | AsyncIterable<ArrayBufferLike | ArrayBufferView>
      | Iterable<ArrayBufferLike | ArrayBufferView>,
    options?: ParquetLoaderOptions,
    context?: LoaderContext
  ) {
    const arrayBuffer = await concatenateArrayBuffersAsync(asyncIterator);
    yield* ParquetLoaderWithParser.parseFileInBatches(new BlobFile(arrayBuffer), options, context);
  },
  serializeWorkerResult: serializeParquetWorkerResult,
  deserializeWorkerResult: deserializeParquetWorkerResult,
  deserializeWorkerBatch: deserializeParquetWorkerBatch
} as const satisfies LoaderWithParser<
  ObjectRowTable | Table,
  ObjectRowTableBatch | RecordBatch,
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
): Promise<ObjectRowTable | Table> {
  const parquetOptions = getParquetOptions({
    ...options,
    signal: options?.signal || context?.signal
  });

  if (parquetOptions.parquet?.shape === 'arrow') {
    return (await parseParquetFileToArrowWithJs(file, parquetOptions)).data;
  }

  const arrowTable = await parseParquetFileToArrowWithJs(file, parquetOptions);
  return convertArrowTable(arrowTable, 'object-row-table');
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
): AsyncIterable<ObjectRowTableBatch | RecordBatch> {
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
    if (parquetOptions.parquet?.shape === 'arrow') {
      if (batch.data.batches.length) yield* batch.data.batches;
      else yield makeArrowMetadataBatch(batch.data.schema);
    } else {
      yield convertArrowTableBatch(batch, 'object-row-table');
    }
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
