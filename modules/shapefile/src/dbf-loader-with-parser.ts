// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderWithParser, StrictLoaderOptions} from '@loaders.gl/loader-utils';
import type {ArrowTable, ArrowTableBatch, ObjectRowTable} from '@loaders.gl/schema';
import {
  parseDBF as parseDBFToObjectRows,
  parseDBFInBatches as parseDBFToObjectRowsInBatches
} from './lib/parsers/parse-dbf';
import {
  parseDBF as parseDBFToArrow,
  parseDBFInBatches as parseDBFToArrowInBatches
} from './lib/parsers/parse-dbf-to-arrow';
import type {DBFHeader, DBFRowsOutput, DBFTableOutput} from './lib/parsers/types';
import {DBFWorkerLoader as DBFWorkerLoaderMetadata} from './dbf-loader';
import {DBFLoader as DBFLoaderMetadata} from './dbf-loader';

const {preload: _DBFWorkerLoaderPreload, ...DBFWorkerLoaderMetadataWithoutPreload} =
  DBFWorkerLoaderMetadata;
const {preload: _DBFLoaderPreload, ...DBFLoaderMetadataWithoutPreload} = DBFLoaderMetadata;

export type DBFLoaderOptions = StrictLoaderOptions & {
  dbf?: {
    encoding?: string;
    shape?: 'rows' | 'table' | 'object-row-table' | 'arrow-table';
    batchSize?: number;
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
export const DBFLoaderWithParser: LoaderWithParser<
  DBFRowsOutput | DBFTableOutput | ObjectRowTable | ArrowTable,
  DBFHeader | DBFRowsOutput | DBFTableOutput | ArrowTableBatch,
  DBFLoaderOptions
> = {
  ...DBFLoaderMetadataWithoutPreload,
  parse: async (arrayBuffer, options) =>
    getDBFShape(options) === 'arrow-table'
      ? parseDBFToArrow(arrayBuffer, options)
      : parseDBFToObjectRows(arrayBuffer, options),
  parseSync: (arrayBuffer, options) =>
    getDBFShape(options) === 'arrow-table'
      ? parseDBFToArrow(arrayBuffer, options)
      : parseDBFToObjectRows(arrayBuffer, options),
  parseInBatches(
    arrayBufferIterator:
      | AsyncIterable<ArrayBufferLike | ArrayBufferView>
      | Iterable<ArrayBufferLike | ArrayBufferView>,
    options
  ) {
    return getDBFShape(options) === 'arrow-table'
      ? parseDBFToArrowInBatches(arrayBufferIterator, options)
      : parseDBFToObjectRowsInBatches(arrayBufferIterator, options);
  }
};

function getDBFShape(options?: DBFLoaderOptions): NonNullable<DBFLoaderOptions['dbf']>['shape'] {
  return options?.dbf?.shape;
}
