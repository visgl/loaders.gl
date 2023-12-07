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
export const ParquetWorkerLoader: Loader<
  ObjectRowTable,
  ObjectRowTableBatch,
  ParquetLoaderOptions
> = {
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
};

/** ParquetJS table loader */
export const ParquetLoader: LoaderWithParser<
  ObjectRowTable | GeoJSONTable,
  ObjectRowTableBatch | GeoJSONTableBatch,
  ParquetLoaderOptions
> = {
  ...ParquetWorkerLoader,
  parse: (arrayBuffer: ArrayBuffer, options?: ParquetLoaderOptions) =>
    parseParquetFile(new BlobFile(arrayBuffer), options),

  parseFile: parseParquetFile,
  parseFileInBatches: parseParquetFileInBatches
};

// Defeat tree shaking
// @ts-ignore
ParquetLoader.Buffer = Buffer;

export const GeoParquetWorkerLoader: Loader<GeoJSONTable, GeoJSONTableBatch, ParquetLoaderOptions> =
  {
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
  };

/** ParquetJS table loader */
export const GeoParquetLoader: LoaderWithParser<
  ObjectRowTable | GeoJSONTable,
  ObjectRowTableBatch | GeoJSONTableBatch,
  ParquetLoaderOptions
> = {
  ...GeoParquetWorkerLoader,
  parse(arrayBuffer: ArrayBuffer, options?: ParquetLoaderOptions) {
    return parseGeoParquetFile(new BlobFile(arrayBuffer), options);
  },
  parseFile: parseGeoParquetFile,
  parseFileInBatches: parseGeoParquetFileInBatches
};

/** @deprecated Test to see if we can improve perf of parquetjs loader */
export const ParquetColumnarWorkerLoader: Loader<
  ColumnarTable,
  ColumnarTableBatch,
  ParquetLoaderOptions
> = {
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
};

/** @deprecated Test to see if we can improve perf of parquetjs loader */
export const ParquetColumnarLoader: LoaderWithParser<
  ColumnarTable,
  ColumnarTableBatch,
  ParquetLoaderOptions
> = {
  ...ParquetColumnarWorkerLoader,
  parse(arrayBuffer: ArrayBuffer, options?: ParquetLoaderOptions) {
    return parseParquetFileInColumns(new BlobFile(arrayBuffer), options);
  },
  parseFile: parseParquetFileInColumns,
  parseFileInBatches: parseParquetFileInColumnarBatches
};
