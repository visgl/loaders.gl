// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderWithParser, StrictLoaderOptions} from '@loaders.gl/core/loader-utils';
import type {ArrowTable, ArrowTableBatch, ObjectRowTable} from '@loaders.gl/core/schema';
import {
  parseDBF as parseDBFToObjectRows,
  parseDBFInBatches as parseDBFToObjectRowsInBatches
} from './lib/parsers/parse-dbf';
import {
  parseDBF as parseDBFToArrow,
  parseDBFInBatches as parseDBFToArrowInBatches
} from './lib/parsers/parse-dbf-to-arrow';
import type {DBFHeader, DBFRowsOutput, DBFTableOutput} from './lib/parsers/types';
import {DBFWorkerLoader as DBFWorkerLoaderMetadata} from './dbf-loader-types';
import {DBFLoader as DBFLoaderMetadata} from './dbf-loader-types';
import {
  deserializeShapefileWorkerResult,
  serializeShapefileWorkerBatch,
  serializeShapefileWorkerResult
} from './lib/shapefile-worker-transport';

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
  },
  serializeWorkerResult: serializeShapefileWorkerResult,
  deserializeWorkerResult: deserializeDBFWorkerResult,
  serializeWorkerBatch: serializeShapefileWorkerBatch,
  deserializeWorkerBatch: deserializeDBFWorkerBatch
};

function getDBFShape(options?: DBFLoaderOptions): NonNullable<DBFLoaderOptions['dbf']>['shape'] {
  return options?.dbf?.shape || 'arrow-table';
}

/** Converts hydrated Arrow scalars to the requested legacy row output on the caller. */
function deserializeDBFWorkerResult(result: unknown, options?: DBFLoaderOptions): any {
  const table = deserializeShapefileWorkerResult<ArrowTable>(result);
  const shape = getDBFShape(options);
  if (shape === 'arrow-table') return table;
  const rows = table.data.toArray().map(row => row.toJSON());
  if (shape === 'rows') return rows;
  if (shape === 'table') return {schema: table.schema, rows};
  return {shape: 'object-row-table', schema: table.schema, data: rows};
}

/** Keeps the legacy initial header and row-array batch contract on the caller. */
function deserializeDBFWorkerBatch(result: unknown, options?: DBFLoaderOptions): any {
  if (getDBFShape(options) === 'arrow-table') return deserializeShapefileWorkerResult(result);
  const table = deserializeShapefileWorkerResult<any>(result);
  return table.shape === 'arrow-table' ? table.data.toArray().map(row => row.toJSON()) : table;
}
