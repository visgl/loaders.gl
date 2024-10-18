// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import type {ArrowTable, ArrowTableBatch} from '@loaders.gl/schema';
import {parseDBF, parseDBFInBatches} from './lib/parsers/parse-dbf-to-arrow';
import {DBFFormat} from './dbf-format';

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
export const DBFArrowWorkerLoader = {
  ...DBFFormat,
  dataType: null as unknown as ArrowTable,
  batchType: null as unknown as ArrowTableBatch,
  version: VERSION,
  worker: true,
  options: {
    dbf: {
      encoding: 'latin1'
    }
  }
} as const satisfies Loader<ArrowTable, ArrowTableBatch, DBFLoaderOptions>;

/** DBF file loader */
export const DBFArrowLoader = {
  ...DBFArrowWorkerLoader,
  parse: async (arrayBuffer, options) => parseDBF(arrayBuffer, options),
  parseSync: parseDBF,
  parseInBatches(arrayBufferIterator: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>, options) {
    return parseDBFInBatches(arrayBufferIterator, options);
  }
} as const satisfies LoaderWithParser<ArrowTable, ArrowTableBatch, DBFLoaderOptions>;
