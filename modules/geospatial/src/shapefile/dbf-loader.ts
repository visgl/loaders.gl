// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Table, RecordBatch} from 'apache-arrow';
import {convertArrowToSchema, makeArrowMetadataBatch} from '@loaders.gl/core/schema-utils';
import type {Loader, LoaderWithParser, StrictLoaderOptions} from '@loaders.gl/core/loader-utils';
import type {ArrowTable, ObjectRowTable} from '@loaders.gl/core/schema';
import {
  parseDBF as parseDBFToObjectRows,
  parseDBFInBatches as parseDBFToObjectRowsInBatches
} from './lib/parsers/parse-dbf';
import {
  parseDBF as parseDBFToArrow,
  parseDBFInBatches as parseDBFToArrowInBatches
} from './lib/parsers/parse-dbf-to-arrow';
import type {DBFHeader, DBFRowsOutput, DBFTableOutput} from './lib/parsers/types';
import {DBFLoader as DBFWorkerLoaderMetadata} from './dbf-loader-types';
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
    shape?: 'rows' | 'table' | 'object-row-table' | 'arrow';
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
export const DBFColumnLoader = {
  ...DBFLoaderMetadataWithoutPreload,
  dataType: null as unknown as DBFRowsOutput | DBFTableOutput | ObjectRowTable | Table,
  batchType: null as unknown as DBFHeader | DBFRowsOutput | DBFTableOutput | RecordBatch,
  parse: async (arrayBuffer, options) =>
    getDBFShape(options) === 'arrow'
      ? parseDBFToArrow(arrayBuffer, options)
      : parseDBFToObjectRows(arrayBuffer, options),
  parseSync: (arrayBuffer, options) =>
    getDBFShape(options) === 'arrow'
      ? parseDBFToArrow(arrayBuffer, options)
      : parseDBFToObjectRows(arrayBuffer, options),
  parseInBatches(
    arrayBufferIterator:
      | AsyncIterable<ArrayBufferLike | ArrayBufferView>
      | Iterable<ArrayBufferLike | ArrayBufferView>,
    options?: DBFLoaderOptions
  ) {
    const batchOptions =
      typeof options?.core?.batchSize === 'number'
        ? {...options, dbf: {...options.dbf, batchSize: options.core.batchSize}}
        : options;
    return getDBFShape(batchOptions) === 'arrow'
      ? parseDBFToArrowInBatches(arrayBufferIterator, batchOptions)
      : parseDBFToObjectRowsInBatches(arrayBufferIterator, batchOptions);
  },
  serializeWorkerResult: serializeShapefileWorkerResult,
  deserializeWorkerResult: deserializeDBFWorkerResult,
  serializeWorkerBatch: serializeShapefileWorkerBatch,
  deserializeWorkerBatch: deserializeDBFWorkerBatch
} as const satisfies LoaderWithParser<
  DBFRowsOutput | DBFTableOutput | ObjectRowTable | Table,
  DBFHeader | DBFRowsOutput | DBFTableOutput | RecordBatch,
  DBFLoaderOptions
>;

function getDBFShape(options?: DBFLoaderOptions): NonNullable<DBFLoaderOptions['dbf']>['shape'] {
  return options?.dbf?.shape || 'arrow';
}

/** Converts hydrated Arrow scalars to the requested legacy row output on the caller. */
function deserializeDBFWorkerResult(result: unknown, options?: DBFLoaderOptions) {
  const value = deserializeShapefileWorkerResult<Table | ArrowTable>(result);
  const table = 'shape' in value ? value.data : value;
  const shape = getDBFShape(options);
  if (shape === 'arrow') return table;
  const rows = table.toArray().map(row => row.toJSON());
  if (shape === 'rows') return rows;
  const schema = convertArrowToSchema(table.schema);
  if (shape === 'table') return {schema, rows};
  return {shape: 'object-row-table' as const, schema, data: rows};
}

/** Keeps legacy header events and materializes row arrays only on the caller. */
function deserializeDBFWorkerBatch(result: unknown, options?: DBFLoaderOptions) {
  const value = deserializeShapefileWorkerResult<DBFHeader | RecordBatch | ArrowTable>(result);
  const batch =
    'shape' in value ? (value.data.batches[0] ?? makeArrowMetadataBatch(value.data.schema)) : value;
  return batch instanceof RecordBatch && getDBFShape(options) !== 'arrow'
    ? batch.toArray().map(row => row.toJSON())
    : batch;
}

/** Exposes native Arrow tables and batches. */
export const DBFLoaderWithParser = DBFColumnLoader;
