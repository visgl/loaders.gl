// loaders.gl, MIT license
// Copyright (c) vis.gl contributors

import type {Loader, LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import type {ObjectRowTable} from '@loaders.gl/schema';
// import type {DBFResult} from './lib/parsers/parse-dbf';
import {parseDBF, parseDBFInBatches} from './lib/parsers/parse-dbf';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Options for loading DBF files */
export type DBFLoaderOptions = LoaderOptions & {
  dbf?: {
    /** Shape of returned table */
    shape?: 'object-row-table';
    /** Encoding of strings in table */
    encoding?: string;
  };
};

/**
 * DBFLoader - DBF files are used to contain non-geometry columns in Shapefiles
 */
export const DBFWorkerLoader: Loader<ObjectRowTable, ObjectRowTable, DBFLoaderOptions> = {
  name: 'DBF',
  id: 'dbf',
  module: 'shapefile',
  version: VERSION,
  worker: true,
  category: 'table',
  extensions: ['dbf'],
  mimeTypes: ['application/x-dbf'],
  options: {
    dbf: {
      shape: 'object-row-table',
      encoding: 'latin1'
    }
  }
};

/** DBF file loader */
export const DBFLoader: LoaderWithParser<ObjectRowTable, ObjectRowTable, DBFLoaderOptions> = {
  ...DBFWorkerLoader,
  parse: async (arrayBuffer: ArrayBuffer, options?: DBFLoaderOptions) => {
    const dbfOptions = {...DBFLoader.options, ...options?.dbf};
    return parseDBF(arrayBuffer, dbfOptions);
  }.
  parseSync: parseDBF,
  parseInBatches(
    arrayBufferIterator: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>,
    options?: DBFLoaderOptions
  ): AsyncIterableIterator<ObjectRowTable> {
    const dbfOptions = {...DBFLoader.options, ...options?.dbf};
    return parseDBFInBatches(arrayBufferIterator, dbfOptions);
  }
};
