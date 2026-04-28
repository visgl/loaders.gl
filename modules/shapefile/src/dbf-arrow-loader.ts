// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, StrictLoaderOptions} from '@loaders.gl/loader-utils';
import type {ArrowTable, ArrowTableBatch} from '@loaders.gl/schema';
import {DBFFormat} from './dbf-format';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type DBFLoaderOptions = StrictLoaderOptions & {
  dbf?: {
    encoding?: string;
    /** Override the URL to the worker bundle (by default loads from unpkg.com) */
    workerUrl?: string;
  };
};

/** Preloads the parser-bearing DBF Arrow loader implementation. */
async function preload() {
  const {DBFArrowLoaderWithParser} = await import('./dbf-arrow-loader-with-parser');
  return DBFArrowLoaderWithParser;
}

/** Metadata-only DBF Arrow worker loader. */
export const DBFArrowWorkerLoader = {
  ...DBFFormat,
  dataType: null as unknown as ArrowTable,
  batchType: null as unknown as ArrowTableBatch,
  version: VERSION,
  worker: true,
  workerFile: 'shapefile-classic.js',
  workerModuleFile: 'shapefile-module.js',
  workerNodeFile: 'shapefile-classic-node.cjs',
  workerLoaderId: 'dbf-arrow',
  options: {
    dbf: {
      encoding: 'latin1'
    }
  },
  preload
} as const satisfies Loader<ArrowTable, ArrowTableBatch, DBFLoaderOptions>;

/** Metadata-only DBF Arrow file loader. */
export const DBFArrowLoader = {
  ...DBFArrowWorkerLoader,
  preload
} as const satisfies Loader<ArrowTable, ArrowTableBatch, DBFLoaderOptions>;
