// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import type {
  ObjectRowTable,
  ObjectRowTableBatch,
  GeoJSONTable,
  GeoJSONTableBatch
  // ColumnarTable,
  // ColumnarTableBatch
} from '@loaders.gl/schema';
import {BlobFile} from '@loaders.gl/loader-utils';

import {parseParquetFile, parseParquetFileInBatches} from './lib/parsers/parse-parquet-to-json';
import {
  parseGeoParquetFile,
  parseGeoParquetFileInBatches
} from './lib/parsers/parse-geoparquet-to-geojson';
// import {
//   parseParquetFileInColumns,
//   parseParquetFileInColumnarBatches
// } from './lib/parsers/parse-parquet-to-columns';
import {ParquetFormat} from './parquet-format';

// Note: The Buffer polyfill is quite fragile
// For some reason, just exporting directly fails with some bundlers
// export {Buffer} from './polyfills/buffer/install-buffer-polyfill';
import {Buffer} from './polyfills/buffer/install-buffer-polyfill';
export {Buffer};

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Options for the parquet loader */
export type ParquetJSONLoaderOptions = LoaderOptions & {
  /** Options for the parquet loader */
  parquet?: {
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
export const ParquetJSONWorkerLoader = {
  ...ParquetFormat,

  dataType: null as unknown as ObjectRowTable,
  batchType: null as unknown as ObjectRowTableBatch,

  id: 'parquet',
  module: 'parquet',
  version: VERSION,
  worker: false,
  options: {
    parquet: {
      columnList: [],
      geoparquet: true,
      url: undefined,
      preserveBinary: false
    }
  }
} as const satisfies Loader<ObjectRowTable, ObjectRowTableBatch, ParquetJSONLoaderOptions>;

/** ParquetJS table loader */
export const ParquetJSONLoader = {
  ...ParquetJSONWorkerLoader,

  dataType: null as unknown as ObjectRowTable,
  batchType: null as unknown as ObjectRowTableBatch,

  parse: (arrayBuffer: ArrayBuffer, options?: ParquetJSONLoaderOptions) =>
    parseParquetFile(new BlobFile(arrayBuffer), options),

  parseFile: parseParquetFile,
  parseFileInBatches: parseParquetFileInBatches
} as const satisfies LoaderWithParser<
  ObjectRowTable,
  ObjectRowTableBatch,
  ParquetJSONLoaderOptions
>;

// Defeat tree shaking
// @ts-ignore
ParquetJSONLoader.Buffer = Buffer;

export const GeoParquetWorkerLoader = {
  ...ParquetFormat,

  dataType: null as unknown as GeoJSONTable,
  batchType: null as unknown as GeoJSONTableBatch,

  id: 'parquet',
  module: 'parquet',
  version: VERSION,
  worker: true,

  options: {
    parquet: {
      columnList: [],
      geoparquet: true,
      url: undefined,
      preserveBinary: false
    }
  }
} as const satisfies Loader<GeoJSONTable, GeoJSONTableBatch, ParquetJSONLoaderOptions>;

/** ParquetJS table loader */
export const GeoParquetLoader = {
  ...GeoParquetWorkerLoader,

  parse(arrayBuffer: ArrayBuffer, options?: ParquetJSONLoaderOptions) {
    return parseGeoParquetFile(new BlobFile(arrayBuffer), options);
  },
  parseFile: parseGeoParquetFile,
  parseFileInBatches: parseGeoParquetFileInBatches
} as const satisfies LoaderWithParser<
  ObjectRowTable | GeoJSONTable,
  ObjectRowTableBatch | GeoJSONTableBatch,
  ParquetJSONLoaderOptions
>;

/** @deprecated Test to see if we can improve perf of parquetjs loader *
export const ParquetJSONColumnarWorkerLoader = {
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
  options: ParquetJSONLoader.options
} as const satisfies Loader<ColumnarTable, ColumnarTableBatch, ParquetJSONLoaderOptions>;

/** @deprecated Test to see if we can improve perf of parquetjs loader *
export const ParquetJSONColumnarLoader = {
  ...ParquetJSONColumnarWorkerLoader,
  parse(arrayBuffer: ArrayBuffer, options?: ParquetJSONLoaderOptions) {
    return parseParquetFileInColumns(new BlobFile(arrayBuffer), options);
  },
  parseFile: parseParquetFileInColumns,
  parseFileInBatches: parseParquetFileInColumnarBatches
} as const satisfies LoaderWithParser<ColumnarTable, ColumnarTableBatch, ParquetJSONLoaderOptions>;
*/
