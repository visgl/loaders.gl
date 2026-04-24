// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderWithParser, StrictLoaderOptions} from '@loaders.gl/loader-utils';
import type {ArrowTable, ArrowTableBatch} from '@loaders.gl/schema';
import {parseDBF, parseDBFInBatches} from './lib/parsers/parse-dbf-to-arrow';
import {DBFArrowWorkerLoader as DBFArrowWorkerLoaderMetadata} from './dbf-arrow-loader';
import {DBFArrowLoader as DBFArrowLoaderMetadata} from './dbf-arrow-loader';

const {preload: _DBFArrowWorkerLoaderPreload, ...DBFArrowWorkerLoaderMetadataWithoutPreload} =
  DBFArrowWorkerLoaderMetadata;
const {preload: _DBFArrowLoaderPreload, ...DBFArrowLoaderMetadataWithoutPreload} =
  DBFArrowLoaderMetadata;

export type DBFLoaderOptions = StrictLoaderOptions & {
  dbf?: {
    encoding?: string;
    /** Override the URL to the worker bundle (by default loads from unpkg.com) */
    workerUrl?: string;
  };
};

/**
 * DBFLoader - DBF files are used to contain non-geometry columns in Shapefiles
 */
export const DBFArrowWorkerLoaderWithParser = {
  ...DBFArrowWorkerLoaderMetadataWithoutPreload
} as const satisfies Loader<ArrowTable, ArrowTableBatch, DBFLoaderOptions>;

/** DBF file loader */
export const DBFArrowLoaderWithParser = {
  ...DBFArrowLoaderMetadataWithoutPreload,
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
} as const satisfies LoaderWithParser<ArrowTable, ArrowTableBatch, DBFLoaderOptions>;
