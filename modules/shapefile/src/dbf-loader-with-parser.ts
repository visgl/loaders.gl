// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderWithParser, StrictLoaderOptions} from '@loaders.gl/loader-utils';
import {parseDBF, parseDBFInBatches} from './lib/parsers/parse-dbf';
import {DBFWorkerLoader as DBFWorkerLoaderMetadata} from './dbf-loader';
import {DBFLoader as DBFLoaderMetadata} from './dbf-loader';

const {preload: _DBFWorkerLoaderPreload, ...DBFWorkerLoaderMetadataWithoutPreload} =
  DBFWorkerLoaderMetadata;
const {preload: _DBFLoaderPreload, ...DBFLoaderMetadataWithoutPreload} = DBFLoaderMetadata;

export type DBFLoaderOptions = StrictLoaderOptions & {
  dbf?: {
    encoding?: string;
    shape?: 'rows' | 'table' | 'object-row-table';
    /** Override the URL to the worker bundle (by default loads from unpkg.com) */
    workerUrl?: string;
  };
};

/**
 * DBFLoaderWithParser - DBF files are used to contain non-geometry columns in Shapefiles
 */
export const DBFWorkerLoaderWithParser = {
  ...DBFWorkerLoaderMetadataWithoutPreload
} as const satisfies Loader<any, any, DBFLoaderOptions>;

/** DBF file loader */
export const DBFLoaderWithParser: LoaderWithParser = {
  ...DBFLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer, options) => parseDBF(arrayBuffer, options),
  parseSync: parseDBF,
  parseInBatches(
    arrayBufferIterator:
      | AsyncIterable<ArrayBufferLike | ArrayBufferView>
      | Iterable<ArrayBufferLike | ArrayBufferView>,
    options
  ) {
    return parseDBFInBatches(arrayBufferIterator, options);
  }
};
