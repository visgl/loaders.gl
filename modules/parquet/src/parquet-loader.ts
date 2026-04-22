// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderWithParser} from '@loaders.gl/loader-utils';
import {concatenateArrayBuffersAsync} from '@loaders.gl/loader-utils';
import type {
  ObjectRowTable,
  ObjectRowTableBatch,
  GeoJSONTable,
  GeoJSONTableBatch,
  ArrowTable,
  ArrowTableBatch
  // ColumnarTable,
  // ColumnarTableBatch
} from '@loaders.gl/schema';
import {BlobFile} from '@loaders.gl/loader-utils';
import type {ReadableFile} from '@loaders.gl/loader-utils';

import {
  parseGeoParquetFile,
  parseGeoParquetFileInBatches
} from './lib/parsers/parse-geoparquet-to-geojson';
import {
  parseParquetArrowTable,
  parseParquetArrowTableInBatches,
  parseParquetObjectRowTable,
  parseParquetObjectRowTableInBatches
} from './lib/parsers/parse-parquet-tables';
import {normalizeParquetOptions} from './lib/utils/normalize-parquet-options';
import {ParquetFormat} from './parquet-format';
import {
  PARQUET_LOADER_DEFAULT_OPTIONS,
  type ParquetLoaderOptions as SharedParquetLoaderOptions
} from './parquet-loader-options';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Options for the parquet loader */
export type ParquetLoaderOptions = SharedParquetLoaderOptions;

const ParquetBaseLoader = {
  ...ParquetFormat,

  dataType: null as unknown as ObjectRowTable | ArrowTable,
  batchType: null as unknown as ObjectRowTableBatch | ArrowTableBatch,

  id: 'parquet',
  module: 'parquet',
  version: VERSION,
  worker: false,
  options: {
    parquet: {
      ...PARQUET_LOADER_DEFAULT_OPTIONS
    }
  }
} as const satisfies Loader<
  ObjectRowTable | ArrowTable,
  ObjectRowTableBatch | ArrowTableBatch,
  ParquetLoaderOptions
>;

/** Parquet table loader supporting object-row and Arrow table output. */
export const ParquetLoader = {
  ...ParquetBaseLoader,
  parse(arrayBuffer: ArrayBuffer, options?: ParquetLoaderOptions) {
    return parseParquetTable(new BlobFile(arrayBuffer), options);
  },

  parseFile(file, options?: ParquetLoaderOptions) {
    return parseParquetTable(file, options);
  },

  parseFileInBatches(file, options?: ParquetLoaderOptions) {
    return parseParquetTableInBatches(file, options);
  },

  async *parseInBatches(
    asyncIterator:
      | AsyncIterable<ArrayBufferLike | ArrayBufferView>
      | Iterable<ArrayBufferLike | ArrayBufferView>,
    options?: ParquetLoaderOptions,
    _context?: unknown
  ) {
    const arrayBuffer = await concatenateArrayBuffersAsync(asyncIterator);
    yield* parseParquetTableInBatches(new BlobFile(arrayBuffer), options);
  }
} as const satisfies LoaderWithParser<
  ObjectRowTable | ArrowTable,
  ObjectRowTableBatch | ArrowTableBatch,
  ParquetLoaderOptions
>;

const GeoParquetBaseLoader = {
  ...ParquetFormat,

  dataType: null as unknown as GeoJSONTable | ArrowTable,
  batchType: null as unknown as GeoJSONTableBatch | ArrowTableBatch,

  id: 'parquet',
  module: 'parquet',
  version: VERSION,
  worker: false,

  options: {
    parquet: {
      ...PARQUET_LOADER_DEFAULT_OPTIONS
    }
  }
} as const satisfies Loader<
  GeoJSONTable | ArrowTable,
  GeoJSONTableBatch | ArrowTableBatch,
  ParquetLoaderOptions
>;

/** GeoParquet table loader that returns GeoJSON tables via Arrow conversion. */
export const GeoParquetLoader = {
  ...GeoParquetBaseLoader,
  parse(arrayBuffer: ArrayBuffer, options?: ParquetLoaderOptions) {
    return parseGeoParquetTable(new BlobFile(arrayBuffer), getParquetOptions(options));
  },
  parseFile(file, options?: ParquetLoaderOptions) {
    return parseGeoParquetTable(file, getParquetOptions(options));
  },
  parseFileInBatches(file, options?: ParquetLoaderOptions) {
    return parseGeoParquetTableInBatches(file, getParquetOptions(options));
  },
  async *parseInBatches(
    asyncIterator:
      | AsyncIterable<ArrayBufferLike | ArrayBufferView>
      | Iterable<ArrayBufferLike | ArrayBufferView>,
    options?: ParquetLoaderOptions,
    _context?: unknown
  ) {
    const arrayBuffer = await concatenateArrayBuffersAsync(asyncIterator);
    yield* parseGeoParquetTableInBatches(new BlobFile(arrayBuffer), getParquetOptions(options));
  }
} as const satisfies LoaderWithParser<
  GeoJSONTable | ArrowTable,
  GeoJSONTableBatch | ArrowTableBatch,
  ParquetLoaderOptions
>;

/**
 * Parses a Parquet file using the canonical wasm-backed table loader.
 * @param file readable file abstraction
 * @param options optional loader options
 * @returns object-row or Arrow table output depending on `parquet.shape`
 */
async function parseParquetTable(
  file: BlobFile | ReadableFile,
  options?: ParquetLoaderOptions
): Promise<ObjectRowTable | ArrowTable> {
  const parquetOptions = getParquetOptions(options);

  if (parquetOptions.parquet?.shape === 'arrow-table') {
    return await parseParquetArrowTable(file, parquetOptions);
  }

  return await parseParquetObjectRowTable(file, parquetOptions);
}

/**
 * Parses a Parquet file into streamed table batches using the canonical wasm-backed loader.
 * @param file readable file abstraction
 * @param options optional loader options
 * @returns async iterable of object-row or Arrow batches
 */
async function* parseParquetTableInBatches(
  file: BlobFile | ReadableFile,
  options?: ParquetLoaderOptions
): AsyncIterable<ObjectRowTableBatch | ArrowTableBatch> {
  const parquetOptions = getParquetOptions(options);

  if (parquetOptions.parquet?.shape === 'arrow-table') {
    yield* parseParquetArrowTableInBatches(file, parquetOptions);
    return;
  }

  yield* parseParquetObjectRowTableInBatches(file, parquetOptions);
}

/**
 * Normalizes caller options for the canonical wasm-backed Parquet loaders.
 * @param options caller-supplied loader options
 * @returns normalized loader options
 */
function getParquetOptions(options?: ParquetLoaderOptions): ParquetLoaderOptions {
  return normalizeParquetOptions(
    {
      ...options,
      parquet: {
        ...(options?.parquet || {}),
        implementation: 'wasm'
      }
    },
    ParquetBaseLoader.options.parquet
  );
}

/**
 * Parses a GeoParquet file into GeoJSON-table or Arrow output.
 * @param file readable file abstraction
 * @param options normalized loader options
 * @returns GeoJSON-table or Arrow output
 */
async function parseGeoParquetTable(
  file: BlobFile | ReadableFile,
  options: ParquetLoaderOptions
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
  options: ParquetLoaderOptions
): AsyncIterable<GeoJSONTableBatch | ArrowTableBatch> {
  if (options.parquet?.shape === 'arrow-table') {
    yield* parseParquetArrowTableInBatches(file, options);
    return;
  }

  yield* parseGeoParquetFileInBatches(file, options);
}
