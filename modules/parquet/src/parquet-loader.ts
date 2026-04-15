// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderWithParser} from '@loaders.gl/loader-utils';
import {concatenateArrayBuffersAsync} from '@loaders.gl/loader-utils';
import {convertArrowToTable} from '@loaders.gl/schema-utils';
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
import {parseParquetFile, parseParquetFileInBatches} from './lib/parsers/parse-parquet-to-json';
// import {
//   parseParquetFileInColumns,
//   parseParquetFileInColumnarBatches
// } from './lib/parsers/parse-parquet-to-columns';
import {normalizeParquetOptions} from './lib/utils/normalize-parquet-options';
import {ParquetFormat} from './parquet-format';
import {ParquetArrowLoader, type ParquetArrowLoaderOptions} from './parquet-arrow-loader';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Options for the parquet loader */
export type ParquetLoaderOptions = ParquetArrowLoaderOptions;

const ParquetBaseLoader = {
  ...ParquetFormat,

  dataType: null as unknown as ObjectRowTable,
  batchType: null as unknown as ObjectRowTableBatch,

  id: 'parquet',
  module: 'parquet',
  version: VERSION,
  worker: false,
  options: {
    parquet: {
      columns: undefined,
      implementation: 'wasm',
      preserveBinary: false
    }
  }
} as const satisfies Loader<ObjectRowTable, ObjectRowTableBatch, ParquetLoaderOptions>;

/** Parquet table loader that returns plain JS object rows via Arrow conversion. */
export const ParquetLoader = {
  ...ParquetBaseLoader,
  parse(arrayBuffer: ArrayBuffer, options?: ParquetLoaderOptions) {
    return parseObjectRowTable(new BlobFile(arrayBuffer), options);
  },

  parseFile(file, options?: ParquetLoaderOptions) {
    return parseObjectRowTable(file, options);
  },

  parseFileInBatches(file, options?: ParquetLoaderOptions) {
    return parseObjectRowTableInBatches(file, options);
  },

  async *parseInBatches(
    asyncIterator:
      | AsyncIterable<ArrayBufferLike | ArrayBufferView>
      | Iterable<ArrayBufferLike | ArrayBufferView>,
    options?: ParquetLoaderOptions,
    _context?: unknown
  ) {
    const arrayBuffer = await concatenateArrayBuffersAsync(asyncIterator);
    yield* parseObjectRowTableInBatches(new BlobFile(arrayBuffer), options);
  }
} as const satisfies LoaderWithParser<ObjectRowTable, ObjectRowTableBatch, ParquetLoaderOptions>;

const GeoParquetBaseLoader = {
  ...ParquetFormat,

  dataType: null as unknown as GeoJSONTable,
  batchType: null as unknown as GeoJSONTableBatch,

  id: 'parquet',
  module: 'parquet',
  version: VERSION,
  worker: false,

  options: {
    parquet: {
      columns: undefined,
      implementation: 'wasm',
      preserveBinary: false
    }
  }
} as const satisfies Loader<GeoJSONTable, GeoJSONTableBatch, ParquetLoaderOptions>;

/** GeoParquet table loader that returns GeoJSON tables via Arrow conversion. */
export const GeoParquetLoader = {
  ...GeoParquetBaseLoader,
  parse(arrayBuffer: ArrayBuffer, options?: ParquetLoaderOptions) {
    return parseGeoParquetFile(new BlobFile(arrayBuffer), getParquetOptions(options));
  },
  parseFile(file, options?: ParquetLoaderOptions) {
    return parseGeoParquetFile(file, getParquetOptions(options));
  },
  parseFileInBatches(file, options?: ParquetLoaderOptions) {
    return parseGeoParquetFileInBatches(file, getParquetOptions(options));
  },
  async *parseInBatches(
    asyncIterator:
      | AsyncIterable<ArrayBufferLike | ArrayBufferView>
      | Iterable<ArrayBufferLike | ArrayBufferView>,
    options?: ParquetLoaderOptions,
    _context?: unknown
  ) {
    const arrayBuffer = await concatenateArrayBuffersAsync(asyncIterator);
    yield* parseGeoParquetFileInBatches(new BlobFile(arrayBuffer), getParquetOptions(options));
  }
} as const satisfies LoaderWithParser<GeoJSONTable, GeoJSONTableBatch, ParquetLoaderOptions>;

async function parseObjectRowTable(
  file: BlobFile | ReadableFile,
  options?: ParquetLoaderOptions
): Promise<ObjectRowTable> {
  const parquetOptions = getParquetOptions(options);
  if (parquetOptions.parquet?.implementation === 'js') {
    return await parseParquetFile(file, parquetOptions);
  }

  const arrowTable = await ParquetArrowLoader.parseFile(file, parquetOptions);
  return convertArrowTableToObjectRows(arrowTable);
}

async function* parseObjectRowTableInBatches(
  file: BlobFile | ReadableFile,
  options?: ParquetLoaderOptions
): AsyncIterable<ObjectRowTableBatch> {
  const parquetOptions = getParquetOptions(options);

  if (parquetOptions.parquet?.implementation === 'js') {
    yield* parseParquetFileInBatches(file, parquetOptions);
    return;
  }

  for await (const batch of ParquetArrowLoader.parseFileInBatches(file, parquetOptions)) {
    const objectRowTable = convertArrowBatchToObjectRows(batch);
    yield {
      batchType: batch.batchType,
      schema: objectRowTable.schema,
      shape: objectRowTable.shape,
      data: objectRowTable.data,
      length: batch.length
    };
  }
}

function convertArrowTableToObjectRows(arrowTable: ArrowTable): ObjectRowTable {
  return convertArrowToTable(arrowTable.data, 'object-row-table') as ObjectRowTable;
}

function getParquetOptions(options?: ParquetLoaderOptions): ParquetLoaderOptions {
  return normalizeParquetOptions(options, ParquetBaseLoader.options.parquet);
}

function convertArrowBatchToObjectRows(batch: ArrowTableBatch): ObjectRowTableBatch {
  const objectRowTable = convertArrowToTable(batch.data, 'object-row-table') as ObjectRowTable;

  return {
    batchType: batch.batchType,
    shape: objectRowTable.shape,
    schema: objectRowTable.schema,
    data: objectRowTable.data,
    length: batch.length
  };
}
