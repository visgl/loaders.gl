// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Table, RecordBatch} from 'apache-arrow';
import {makeArrowMetadataBatch} from '@loaders.gl/core/schema-utils';
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
  dataType: null as unknown as DBFRowsOutput | DBFTableOutput | ObjectRowTable | ArrowTable,
  batchType: null as unknown as DBFHeader | DBFRowsOutput | DBFTableOutput | ArrowTableBatch,
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
  DBFRowsOutput | DBFTableOutput | ObjectRowTable | ArrowTable,
  DBFHeader | DBFRowsOutput | DBFTableOutput | ArrowTableBatch,
  DBFLoaderOptions
>;

function getDBFShape(options?: DBFLoaderOptions): NonNullable<DBFLoaderOptions['dbf']>['shape'] {
  return options?.dbf?.shape || 'arrow';
}

/** Converts hydrated Arrow scalars to the requested legacy row output on the caller. */
function deserializeDBFWorkerResult(result: unknown, options?: DBFLoaderOptions): any {
  const table = deserializeShapefileWorkerResult<ArrowTable>(result);
  const shape = getDBFShape(options);
  if (shape === 'arrow') return table;
  const rows = table.data.toArray().map(row => row.toJSON());
  if (shape === 'rows') return rows;
  if (shape === 'table') return {schema: table.schema, rows};
  return {shape: 'object-row-table', schema: table.schema, data: rows};
}

/** Keeps the legacy initial header and row-array batch contract on the caller. */
function deserializeDBFWorkerBatch(result: unknown, options?: DBFLoaderOptions): any {
  if (getDBFShape(options) === 'arrow') return deserializeShapefileWorkerResult(result);
  const table = deserializeShapefileWorkerResult<any>(result);
  return table.shape === 'arrow-table' ? table.data.toArray().map(row => row.toJSON()) : table;
}

/** Exposes native Arrow output after parsing or worker hydration. */
export const DBFLoaderWithParser = {
  ...DBFColumnLoader,
  dataType: null as unknown as DBFRowsOutput | DBFTableOutput | ObjectRowTable | Table,
  batchType: null as unknown as DBFHeader | DBFRowsOutput | DBFTableOutput | RecordBatch,
  async parse(input, options) {
    return unwrapDBFTable(await DBFColumnLoader.parse(input, options));
  },
  parseSync(input, options) {
    return unwrapDBFTable(DBFColumnLoader.parseSync(input, options));
  },
  async *parseInBatches(input, options) {
    for await (const batch of DBFColumnLoader.parseInBatches(input, options)) {
      if (isDBFArrowTable(batch)) {
        const table = unwrapDBFTable(batch);
        if (table.batches.length) yield* table.batches;
        else yield makeArrowMetadataBatch(table.schema);
      } else yield batch;
    }
  },
  deserializeWorkerResult(result, options) {
    return unwrapDBFTable(deserializeDBFWorkerResult(result, options));
  },
  deserializeWorkerBatch(result, options) {
    const batch = deserializeDBFWorkerBatch(result, options);
    if (!isDBFArrowTable(batch)) return batch;
    const table = unwrapDBFTable(batch);
    return table.batches[0] ?? makeArrowMetadataBatch(table.schema);
  }
} as const satisfies LoaderWithParser<
  DBFRowsOutput | DBFTableOutput | ObjectRowTable | Table,
  DBFHeader | DBFRowsOutput | DBFTableOutput | RecordBatch,
  DBFLoaderOptions
>;

/** Identifies Arrow output from the private column parser. */
function isDBFArrowTable(result: unknown): result is ArrowTable {
  return (result as {shape?: string} | null)?.shape === 'arrow-table';
}

/** Unwraps Arrow columns and passes through legacy results. */
function unwrapDBFTable(result: ArrowTable): Table;
function unwrapDBFTable<T>(result: T): Exclude<T, ArrowTable> | Table;
function unwrapDBFTable(result: unknown): unknown {
  if (!isDBFArrowTable(result)) return result;
  return result.data;
}
