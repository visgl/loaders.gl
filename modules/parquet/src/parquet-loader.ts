// loaders.gl, MIT license
// Copyright (c) vis.gl contributors
import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';
import type {
  ObjectRowTable,
  ObjectRowTableBatch,
  ColumnarTable,
  ColumnarTableBatch
} from '@loaders.gl/schema';

export {Buffer} from './buffer-polyfill/install-buffer-polyfill';

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

/** ParquetJS table loader */
export const ParquetLoader: Loader<ObjectRowTable, ObjectRowTableBatch, ParquetLoaderOptions> = {
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

export const ParquetColumnarLoader: Loader<
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

// Defeat tree shaking
// @ts-ignore
ParquetLoader.Buffer = Buffer;
// @ts-ignore
ParquetColumnarLoader.Buffer = Buffer;
