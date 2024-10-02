// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import type {ArrayRowTable, ObjectRowTable, TableBatch} from '@loaders.gl/schema';

import {
  AsyncQueue,
  TableBatchBuilder,
  convertToArrayRow,
  convertToObjectRow
} from '@loaders.gl/schema';
import Papa from './papaparse/papaparse';
import AsyncIteratorStreamer from './papaparse/async-iterator-streamer';

type ObjectField = {name: string; index: number; type: any};
type ObjectSchema = {[key: string]: ObjectField} | ObjectField[];

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

const DEFAULT_CSV_SHAPE = 'object-row-table';

export type CSVLoaderOptions = LoaderOptions & {
  csv?: {
    // loaders.gl options
    shape?: 'array-row-table' | 'object-row-table';
    /** optimizes memory usage but increases parsing time. */
    optimizeMemoryUsage?: boolean;
    columnPrefix?: string;
    header?: 'auto';

    // CSV options (papaparse)
    // delimiter: auto
    // newline: auto
    quoteChar?: string;
    escapeChar?: string;
    // Convert numbers and boolean values in rows from strings
    dynamicTyping?: boolean;
    comments?: boolean;
    skipEmptyLines?: boolean | 'greedy';
    // transform: null?
    delimitersToGuess?: string[];
    // fastMode: auto
  };
};

export const CSVLoader = {
  dataType: null as unknown as ObjectRowTable | ArrayRowTable,
  batchType: null as unknown as TableBatch,

  id: 'csv',
  module: 'csv',
  name: 'CSV',
  version: VERSION,
  extensions: ['csv', 'tsv', 'dsv'],
  mimeTypes: ['text/csv', 'text/tab-separated-values', 'text/dsv'],
  category: 'table',
  parse: async (arrayBuffer: ArrayBuffer, options?: CSVLoaderOptions) =>
    parseCSV(new TextDecoder().decode(arrayBuffer), options),
  parseText: (text: string, options?: CSVLoaderOptions) => parseCSV(text, options),
  parseInBatches: parseCSVInBatches,
  // @ts-ignore
  // testText: null,
  options: {
    csv: {
      shape: DEFAULT_CSV_SHAPE, // 'object-row-table'
      optimizeMemoryUsage: false,
      // CSV options
      header: 'auto',
      columnPrefix: 'column',
      // delimiter: auto
      // newline: auto
      quoteChar: '"',
      escapeChar: '"',
      dynamicTyping: true,
      comments: false,
      skipEmptyLines: true,
      // transform: null?
      delimitersToGuess: [',', '\t', '|', ';']
      // fastMode: auto
    }
  }
} as const satisfies LoaderWithParser<ObjectRowTable | ArrayRowTable, TableBatch, CSVLoaderOptions>;

async function parseCSV(
  csvText: string,
  options?: CSVLoaderOptions
): Promise<ObjectRowTable | ArrayRowTable> {
  // Apps can call the parse method directly, we so apply default options here
  const csvOptions = {...CSVLoader.options.csv, ...options?.csv};

  const firstRow = readFirstRow(csvText);
  const header: boolean =
    csvOptions.header === 'auto' ? isHeaderRow(firstRow) : Boolean(csvOptions.header);

  const parseWithHeader = header;

  const papaparseConfig = {
    // dynamicTyping: true,
    ...csvOptions,
    header: parseWithHeader,
    download: false, // We handle loading, no need for papaparse to do it for us
    transformHeader: parseWithHeader ? duplicateColumnTransformer() : undefined,
    error: (e) => {
      throw new Error(e);
    }
  };

  const result = Papa.parse(csvText, papaparseConfig);
  const rows = result.data as any[];

  const headerRow = result.meta.fields || generateHeader(csvOptions.columnPrefix, firstRow.length);

  const shape = csvOptions.shape || DEFAULT_CSV_SHAPE;
  switch (shape) {
    case 'object-row-table':
      return {
        shape: 'object-row-table',
        data: rows.map((row) => (Array.isArray(row) ? convertToObjectRow(row, headerRow) : row))
      };
    case 'array-row-table':
      return {
        shape: 'array-row-table',
        data: rows.map((row) => (Array.isArray(row) ? row : convertToArrayRow(row, headerRow)))
      };
    default:
      throw new Error(shape);
  }
}

// TODO - support batch size 0 = no batching/single batch?
function parseCSVInBatches(
  asyncIterator: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>,
  options?: CSVLoaderOptions
): AsyncIterable<TableBatch> {
  // Papaparse does not support standard batch size handling
  // TODO - investigate papaparse chunks mode
  options = {...options};
  if (options.batchSize === 'auto') {
    options.batchSize = 4000;
  }

  // Apps can call the parse method directly, we so apply default options here
  const csvOptions = {...CSVLoader.options.csv, ...options?.csv};

  const asyncQueue = new AsyncQueue<TableBatch>();

  let isFirstRow: boolean = true;
  let headerRow: string[] | null = null;
  let tableBatchBuilder: TableBatchBuilder | null = null;
  let schema: ObjectSchema | null = null;

  const config = {
    // dynamicTyping: true, // Convert numbers and boolean values in rows from strings,
    ...csvOptions,
    header: false, // Unfortunately, header detection is not automatic and does not infer shapes
    download: false, // We handle loading, no need for papaparse to do it for us
    // chunkSize is set to 5MB explicitly (same as Papaparse default) due to a bug where the
    // streaming parser gets stuck if skipEmptyLines and a step callback are both supplied.
    // See https://github.com/mholt/PapaParse/issues/465
    chunkSize: 1024 * 1024 * 5,
    // skipEmptyLines is set to a boolean value if supplied. Greedy is set to true
    // skipEmptyLines is handled manually given two bugs where the streaming parser gets stuck if
    // both of the skipEmptyLines and step callback options are provided:
    // - true doesn't work unless chunkSize is set: https://github.com/mholt/PapaParse/issues/465
    // - greedy doesn't work: https://github.com/mholt/PapaParse/issues/825
    skipEmptyLines: false,

    // step is called on every row
    // eslint-disable-next-line complexity, max-statements
    step(results) {
      let row = results.data;

      if (csvOptions.skipEmptyLines) {
        // Manually reject lines that are empty
        const collapsedRow = row.flat().join('').trim();
        if (collapsedRow === '') {
          return;
        }
      }
      const bytesUsed = results.meta.cursor;

      // Check if we need to save a header row
      if (isFirstRow && !headerRow) {
        // Auto detects or can be forced with csvOptions.header
        const header = csvOptions.header === 'auto' ? isHeaderRow(row) : Boolean(csvOptions.header);
        if (header) {
          headerRow = row.map(duplicateColumnTransformer());
          return;
        }
      }

      // If first data row, we can deduce the schema
      if (isFirstRow) {
        isFirstRow = false;
        if (!headerRow) {
          headerRow = generateHeader(csvOptions.columnPrefix, row.length);
        }
        schema = deduceSchema(row, headerRow);
      }

      if (csvOptions.optimizeMemoryUsage) {
        // A workaround to allocate new strings and don't retain pointers to original strings.
        // https://bugs.chromium.org/p/v8/issues/detail?id=2869
        row = JSON.parse(JSON.stringify(row));
      }

      const shape = csvOptions.shape || DEFAULT_CSV_SHAPE;

      // Add the row
      tableBatchBuilder =
        tableBatchBuilder ||
        new TableBatchBuilder(
          // @ts-expect-error TODO this is not a proper schema
          schema,
          {
            shape,
            ...options
          }
        );

      try {
        tableBatchBuilder.addRow(row);
        // If a batch has been completed, emit it
        const batch = tableBatchBuilder && tableBatchBuilder.getFullBatch({bytesUsed});
        if (batch) {
          asyncQueue.enqueue(batch);
        }
      } catch (error) {
        asyncQueue.enqueue(error as Error);
      }
    },

    // complete is called when all rows have been read
    complete(results) {
      try {
        const bytesUsed = results.meta.cursor;
        // Ensure any final (partial) batch gets emitted
        const batch = tableBatchBuilder && tableBatchBuilder.getFinalBatch({bytesUsed});
        if (batch) {
          asyncQueue.enqueue(batch);
        }
      } catch (error) {
        asyncQueue.enqueue(error as Error);
      }

      asyncQueue.close();
    }
  };

  Papa.parse(asyncIterator, config, AsyncIteratorStreamer);

  // TODO - Does it matter if we return asyncIterable or asyncIterator
  // return asyncQueue[Symbol.asyncIterator]();
  return asyncQueue;
}

/**
 * Checks if a certain row is a header row
 * @param row the row to check
 * @returns true if the row looks like a header
 */
function isHeaderRow(row: string[]): boolean {
  return row && row.every((value) => typeof value === 'string');
}

/**
 * Reads, parses, and returns the first row of a CSV text
 * @param csvText the csv text to parse
 * @returns the first row
 */
function readFirstRow(csvText: string): any[] {
  const result = Papa.parse(csvText, {
    dynamicTyping: true,
    preview: 1
  });
  return result.data[0];
}

/**
 * Creates a transformer that renames duplicate columns. This is needed as Papaparse doesn't handle
 * duplicate header columns and would use the latest occurrence by default.
 * See the header option in https://www.papaparse.com/docs#config
 * @returns a transform function that returns sanitized names for duplicate fields
 */
function duplicateColumnTransformer(): (column: string) => string {
  const observedColumns = new Set<string>();
  return (col) => {
    let colName = col;
    let counter = 1;
    while (observedColumns.has(colName)) {
      colName = `${col}.${counter}`;
      counter++;
    }
    observedColumns.add(colName);
    return colName;
  };
}

/**
 * Generates the header of a CSV given a prefix and a column count
 * @param columnPrefix the columnPrefix to use
 * @param count the count of column names to generate
 * @returns an array of column names
 */
function generateHeader(columnPrefix: string, count: number = 0): string[] {
  const headers: string[] = [];
  for (let i = 0; i < count; i++) {
    headers.push(`${columnPrefix}${i + 1}`);
  }
  return headers;
}

function deduceSchema(row, headerRow): ObjectSchema {
  const schema: ObjectSchema = headerRow ? {} : [];
  for (let i = 0; i < row.length; i++) {
    const columnName = (headerRow && headerRow[i]) || i;
    const value = row[i];
    switch (typeof value) {
      case 'number':
      case 'boolean':
        // TODO - booleans could be handled differently...
        schema[columnName] = {name: String(columnName), index: i, type: Float32Array};
        break;
      case 'string':
      default:
        schema[columnName] = {name: String(columnName), index: i, type: Array};
      // We currently only handle numeric rows
      // TODO we could offer a function to map strings to numbers?
    }
  }
  return schema;
}
