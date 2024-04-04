// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import {parseDBF, parseDBFInBatches} from './lib/parsers/parse-dbf';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type DBFLoaderOptions = LoaderOptions & {
  dbf?: {
    encoding?: string;
    /** Override the URL to the worker bundle (by default loads from unpkg.com) */
    workerUrl?: string;
  };
};

/**
 * DBFLoader - DBF files are used to contain non-geometry columns in Shapefiles
 */
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
  }
} as const satisfies Loader<any, any, DBFLoaderOptions>;

/** DBF file loader */
export const DBFLoader: LoaderWithParser = {
  ...DBFWorkerLoader,
  parse: async (arrayBuffer, options) => parseDBF(arrayBuffer, options),
  parseSync: parseDBF,
  parseInBatches(arrayBufferIterator: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>, options) {
    return parseDBFInBatches(arrayBufferIterator, options);
  }
};
