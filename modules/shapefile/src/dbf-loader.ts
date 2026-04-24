// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, StrictLoaderOptions} from '@loaders.gl/loader-utils';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type DBFLoaderOptions = StrictLoaderOptions & {
  dbf?: {
    encoding?: string;
    shape?: 'rows' | 'table' | 'object-row-table';
    /** Override the URL to the worker bundle (by default loads from unpkg.com) */
    workerUrl?: string;
  };
};

/** Preloads the parser-bearing DBF loader implementation. */
async function preload() {
  const {DBFLoaderWithParser} = await import('./dbf-loader-with-parser');
  return DBFLoaderWithParser;
}

/** Metadata-only DBF worker loader. */
export const DBFWorkerLoader = {
  name: 'DBF',
  dataType: null as unknown,
  batchType: null as never,

  id: 'dbf',
  module: 'shapefile',
  version: VERSION,
  worker: true,
  category: 'table',
  extensions: ['dbf'],
  mimeTypes: ['application/x-dbf'],
  options: {
    dbf: {
      encoding: 'latin1'
    }
  },
  preload
} as const satisfies Loader<any, any, DBFLoaderOptions>;

/** Metadata-only DBF file loader. */
export const DBFLoader: Loader<any, any, DBFLoaderOptions> = {
  ...DBFWorkerLoader,
  preload
};
