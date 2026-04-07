// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import type {
  ArrowTable,
  ArrowTableBatch,
  ArrayRowTable,
  ObjectRowTable,
  TableBatch
} from '@loaders.gl/schema';

import type {CSVArrowLoaderOptions} from './csv-arrow-loader';
import {CSVArrowLoader} from './csv-arrow-loader';
import type {CSVLoaderOptions} from './csv-loader';
import {CSVLoader} from './csv-loader';

/** Row table shapes produced by the internal CSV2 loader. */
type CSV2Table = ObjectRowTable | ArrayRowTable;

/** Supported row materialization shape names. */
type CSV2Shape = NonNullable<NonNullable<CSVLoaderOptions['csv']>['shape']>;

/** Minimal Arrow column interface used during JS row materialization. */
type CSVArrowColumn = {get: (index: number) => unknown};

/** CSV loader that parses through CSVArrowLoader and materializes JS row tables. */
export const CSV2Loader = {
  ...CSVLoader,

  id: 'csv2',
  name: 'CSV2',
  dataType: null as unknown as CSV2Table,
  batchType: null as unknown as TableBatch,

  parse: async (arrayBuffer: ArrayBuffer, options?: CSVLoaderOptions) => {
    const arrowTable = await CSVArrowLoader.parse(arrayBuffer, createCSVArrowOptions(options));
    return convertCSVArrowTableToRowTable(arrowTable, getCSV2Shape(options));
  },

  parseText: async (text: string, options?: CSVLoaderOptions) => {
    const arrowTable = await CSVArrowLoader.parseText(text, createCSVArrowOptions(options));
    return convertCSVArrowTableToRowTable(arrowTable, getCSV2Shape(options));
  },

  parseInBatches: (
    asyncIterator:
      | AsyncIterable<ArrayBufferLike | ArrayBufferView>
      | Iterable<ArrayBufferLike | ArrayBufferView>,
    options?: CSVLoaderOptions
  ) =>
    makeCSV2BatchIterator(
      CSVArrowLoader.parseInBatches(asyncIterator, createCSVArrowOptions(options)),
      options
    )
} as const satisfies LoaderWithParser<CSV2Table, TableBatch, CSVLoaderOptions>;

/** Converts Arrow CSV batches to the configured JS row table shape. */
async function* makeCSV2BatchIterator(
  arrowBatchIterator: AsyncIterable<ArrowTableBatch>,
  options?: CSVLoaderOptions
): AsyncIterable<TableBatch> {
  const shape = getCSV2Shape(options);
  for await (const arrowBatch of arrowBatchIterator) {
    const table = convertCSVArrowTableToRowTable(
      {
        shape: 'arrow-table',
        schema: arrowBatch.schema,
        data: arrowBatch.data
      },
      shape
    );
    yield {
      ...table,
      batchType: arrowBatch.batchType,
      length: arrowBatch.length
    };
  }
}

/** Returns the requested CSV2 row shape, using CSVLoader's default shape. */
function getCSV2Shape(options?: CSVLoaderOptions): CSV2Shape {
  return options?.csv?.shape || CSV2Loader.options.csv.shape || 'object-row-table';
}

/** Creates CSVArrowLoader options by removing row-shape-only CSV options. */
function createCSVArrowOptions(options?: CSVLoaderOptions): CSVArrowLoaderOptions {
  const csvOptions = {...CSV2Loader.options.csv, ...options?.csv};
  const arrowCSVOptions = {...csvOptions};
  delete (arrowCSVOptions as {shape?: CSV2Shape}).shape;
  return {
    ...options,
    csv: arrowCSVOptions
  };
}

/** Converts an Arrow CSV table to a loaders.gl JS row table without generic row wrappers. */
function convertCSVArrowTableToRowTable(arrowTable: ArrowTable, shape: CSV2Shape): CSV2Table {
  switch (shape) {
    case 'array-row-table':
      return convertCSVArrowTableToArrayRowTable(arrowTable);
    case 'object-row-table':
      return convertCSVArrowTableToObjectRowTable(arrowTable);
    default:
      throw new Error(shape);
  }
}

/** Converts an Arrow CSV table to an array-row table. */
function convertCSVArrowTableToArrayRowTable(arrowTable: ArrowTable): ArrayRowTable {
  const arrowData = arrowTable.data;
  const columnCount = arrowData.numCols;
  const columns = getArrowColumns(arrowTable);
  const rows = new Array<unknown[]>(arrowData.numRows);

  for (let rowIndex = 0; rowIndex < arrowData.numRows; rowIndex++) {
    const row = new Array<unknown>(columnCount);
    for (let columnIndex = 0; columnIndex < columnCount; columnIndex++) {
      row[columnIndex] = columns[columnIndex]?.get(rowIndex);
    }
    rows[rowIndex] = row;
  }

  return {
    shape: 'array-row-table',
    schema: arrowTable.schema,
    data: rows
  };
}

/** Converts an Arrow CSV table to an object-row table. */
function convertCSVArrowTableToObjectRowTable(arrowTable: ArrowTable): ObjectRowTable {
  const arrowData = arrowTable.data;
  const fields = arrowData.schema.fields;
  const columns = getArrowColumns(arrowTable);
  const rows = new Array<{[key: string]: unknown}>(arrowData.numRows);

  for (let rowIndex = 0; rowIndex < arrowData.numRows; rowIndex++) {
    const row: {[key: string]: unknown} = {};
    for (let columnIndex = 0; columnIndex < fields.length; columnIndex++) {
      row[fields[columnIndex].name] = columns[columnIndex]?.get(rowIndex);
    }
    rows[rowIndex] = row;
  }

  return {
    shape: 'object-row-table',
    schema: arrowTable.schema,
    data: rows
  };
}

/** Returns Arrow columns once so row materialization does not repeatedly look them up by name. */
function getArrowColumns(arrowTable: ArrowTable): Array<CSVArrowColumn | null> {
  const columns: Array<CSVArrowColumn | null> = new Array(arrowTable.data.numCols);
  for (let columnIndex = 0; columnIndex < arrowTable.data.numCols; columnIndex++) {
    columns[columnIndex] = arrowTable.data.getChildAt(columnIndex) || null;
  }
  return columns;
}
