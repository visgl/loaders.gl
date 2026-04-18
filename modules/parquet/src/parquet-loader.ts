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

function getParquetOptions(options?: ParquetLoaderOptions): ParquetLoaderOptions {
  return normalizeParquetOptions(options, ParquetBaseLoader.options.parquet);
}

async function parseGeoParquetTable(
  file: BlobFile | ReadableFile,
  options: ParquetLoaderOptions
): Promise<GeoJSONTable | ArrowTable> {
  if (options.parquet?.shape === 'arrow-table') {
    return await parseParquetArrowTable(file, options);
  }

  return await parseGeoParquetFile(file, options);
}

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
