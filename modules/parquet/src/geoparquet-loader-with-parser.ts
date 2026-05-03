// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import {BlobFile, concatenateArrayBuffersAsync} from '@loaders.gl/loader-utils';
import type {ReadableFile} from '@loaders.gl/loader-utils';
import type {
  ArrowTable,
  ArrowTableBatch,
  GeoJSONTable,
  GeoJSONTableBatch
} from '@loaders.gl/schema';

import {
  parseGeoParquetFile,
  parseGeoParquetFileInBatches
} from './lib/parsers/parse-geoparquet-to-geojson';
import {
  parseParquetArrowTable,
  parseParquetArrowTableInBatches
} from './lib/parsers/parse-parquet-tables';
import {
  GeoParquetLoader as GeoParquetLoaderMetadata,
  type GeoParquetLoaderOptions
} from './geoparquet-loader';
import {getParquetOptions} from './parquet-loader-with-parser';

const {preload: _GeoParquetLoaderPreload, ...GeoParquetLoaderMetadataWithoutPreload} =
  GeoParquetLoaderMetadata;

export type {GeoParquetLoaderOptions} from './geoparquet-loader';

/** GeoParquet table loader that returns GeoJSON tables via Arrow conversion. */
export const GeoParquetLoaderWithParser = {
  ...GeoParquetLoaderMetadataWithoutPreload,
  parse(arrayBuffer: ArrayBuffer, options?: GeoParquetLoaderOptions) {
    return parseGeoParquetTable(new BlobFile(arrayBuffer), getParquetOptions(options));
  },
  parseFile(file, options?: GeoParquetLoaderOptions) {
    return parseGeoParquetTable(file, getParquetOptions(options));
  },
  parseFileInBatches(file, options?: GeoParquetLoaderOptions) {
    return parseGeoParquetTableInBatches(file, getParquetOptions(options));
  },
  async *parseInBatches(
    asyncIterator:
      | AsyncIterable<ArrayBufferLike | ArrayBufferView>
      | Iterable<ArrayBufferLike | ArrayBufferView>,
    options?: GeoParquetLoaderOptions,
    _context?: unknown
  ) {
    const arrayBuffer = await concatenateArrayBuffersAsync(asyncIterator);
    yield* parseGeoParquetTableInBatches(new BlobFile(arrayBuffer), getParquetOptions(options));
  }
} as const satisfies LoaderWithParser<
  GeoJSONTable | ArrowTable,
  GeoJSONTableBatch | ArrowTableBatch,
  GeoParquetLoaderOptions
>;

/**
 * Parses a GeoParquet file into GeoJSON-table or Arrow output.
 * @param file readable file abstraction
 * @param options normalized loader options
 * @returns GeoJSON-table or Arrow output
 */
async function parseGeoParquetTable(
  file: BlobFile | ReadableFile,
  options: GeoParquetLoaderOptions
): Promise<GeoJSONTable | ArrowTable> {
  if (options.parquet?.shape === 'arrow-table') {
    return await parseParquetArrowTable(file, options);
  }

  return await parseGeoParquetFile(file, options);
}

/**
 * Parses a GeoParquet file into streamed GeoJSON-table or Arrow batches.
 * @param file readable file abstraction
 * @param options normalized loader options
 * @returns async iterable of GeoJSON-table or Arrow batches
 */
async function* parseGeoParquetTableInBatches(
  file: BlobFile | ReadableFile,
  options: GeoParquetLoaderOptions
): AsyncIterable<GeoJSONTableBatch | ArrowTableBatch> {
  if (options.parquet?.shape === 'arrow-table') {
    yield* parseParquetArrowTableInBatches(file, options);
    return;
  }

  yield* parseGeoParquetFileInBatches(file, options);
}
