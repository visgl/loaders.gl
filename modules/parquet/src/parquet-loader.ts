// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import type {
  ObjectRowTable,
  ObjectRowTableBatch,
  GeoJSONTable,
  GeoJSONTableBatch,
  ColumnarTable,
  ColumnarTableBatch
} from '@loaders.gl/schema';
import {BlobFile} from '@loaders.gl/loader-utils';

import {parseParquetFile, parseParquetFileInBatches} from './lib/parsers/parse-parquet';
import {parseGeoParquetFile, parseGeoParquetFileInBatches} from './lib/parsers/parse-geoparquet';
import {
  parseParquetFileInColumns,
  parseParquetFileInColumnarBatches
} from './lib/parsers/parse-parquet-to-columns';

export {Buffer} from './polyfills/buffer/install-buffer-polyfill';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Options for the parquet loader */
export type ParquetLoaderOptions = LoaderOptions & {
  /** Options for the parquet loader */
  parquet?: {
    /** Format of returned parsed data */
    shape?: 'object-row-table' | 'geojson-table';
    /** Restrict which columns that are parsed from the table. Can save significant memory. */
    columnList?: string[] | string[][];
    /** If true, binary values are not converted to strings */
    preserveBinary?: boolean;
    /**  @deprecated not used? Set to true to indicate that this is a geoparquet file. */
    geoparquet?: boolean;
    /** @deprecated URL to override loaders.gl/core parser system */
    url?: string;
  };
};

/**
 * ParquetJS table loader
 */
export const ParquetWorkerLoader = {
  dataType: null as unknown as ObjectRowTable,
  batchType: null as unknown as ObjectRowTableBatch,

  name: 'Apache Parquet',
  id: 'parquet',
  module: 'parquet',
  version: VERSION,
  worker: true,
  category: 'table',
  extensions: ['parquet'],
  mimeTypes: ['application/octet-stream'],
  binary: true,
  tests: ['PAR1', 'PARE'],
  options: {
    parquet: {
      shape: 'object-row-table',
      columnList: [],
      geoparquet: true,
      url: undefined,
      preserveBinary: false
    }
  }
} as const satisfies Loader<ObjectRowTable, ObjectRowTableBatch, ParquetLoaderOptions>;

/** ParquetJS table loader */
export const ParquetLoader = {
  ...ParquetWorkerLoader,

  dataType: null as unknown as ObjectRowTable | GeoJSONTable,
  batchType: null as unknown as ObjectRowTableBatch | GeoJSONTableBatch,

  parse: (arrayBuffer: ArrayBuffer, options?: ParquetLoaderOptions) =>
    parseParquetFile(new BlobFile(arrayBuffer), options),

  parseFile: parseParquetFile,
  parseFileInBatches: parseParquetFileInBatches
} as const satisfies LoaderWithParser<
  ObjectRowTable | GeoJSONTable,
  ObjectRowTableBatch | GeoJSONTableBatch,
  ParquetLoaderOptions
>;

// Defeat tree shaking
// @ts-ignore
ParquetLoader.Buffer = Buffer;

export const GeoParquetWorkerLoader = {
  dataType: null as unknown as GeoJSONTable,
  batchType: null as unknown as GeoJSONTableBatch,

  name: 'Apache Parquet',
  id: 'parquet',
  module: 'parquet',
  version: VERSION,
  worker: true,
  category: 'table',
  extensions: ['parquet'],
  mimeTypes: ['application/octet-stream'],
  binary: true,
  tests: ['PAR1', 'PARE'],
  options: {
    parquet: {
      shape: 'geojson-table',
      columnList: [],
      geoparquet: true,
      url: undefined,
      preserveBinary: false
    }
  }
} as const satisfies Loader<GeoJSONTable, GeoJSONTableBatch, ParquetLoaderOptions>;

/** ParquetJS table loader */
export const GeoParquetLoader = {
  ...GeoParquetWorkerLoader,

  parse(arrayBuffer: ArrayBuffer, options?: ParquetLoaderOptions) {
    return parseGeoParquetFile(new BlobFile(arrayBuffer), options);
  },
  parseFile: parseGeoParquetFile,
  parseFileInBatches: parseGeoParquetFileInBatches
} as const satisfies LoaderWithParser<
  ObjectRowTable | GeoJSONTable,
  ObjectRowTableBatch | GeoJSONTableBatch,
  ParquetLoaderOptions
>;

/** @deprecated Test to see if we can improve perf of parquetjs loader */
export const ParquetColumnarWorkerLoader = {
  dataType: null as any as ColumnarTable,
  batchType: null as any as ColumnarTableBatch,

  name: 'Apache Parquet',
  id: 'parquet',
  module: 'parquet',
  version: VERSION,
  worker: true,
  category: 'table',
  extensions: ['parquet'],
  mimeTypes: ['application/octet-stream'],
  binary: true,
  tests: ['PAR1', 'PARE'],
  options: ParquetLoader.options
} as const satisfies Loader<ColumnarTable, ColumnarTableBatch, ParquetLoaderOptions>;

/** @deprecated Test to see if we can improve perf of parquetjs loader */
export const ParquetColumnarLoader = {
  ...ParquetColumnarWorkerLoader,
  parse(arrayBuffer: ArrayBuffer, options?: ParquetLoaderOptions) {
    return parseParquetFileInColumns(new BlobFile(arrayBuffer), options);
  },
  parseFile: parseParquetFileInColumns,
  parseFileInBatches: parseParquetFileInColumnarBatches
} as const satisfies LoaderWithParser<ColumnarTable, ColumnarTableBatch, ParquetLoaderOptions>;
