/* global TextDecoder */
import {AsyncQueue, TableBatchBuilder, RowTableBatch} from '@loaders.gl/tables';
import Papa from './libs/papaparse';
import AsyncIteratorStreamer from './lib/async-iterator-streamer';
/** @typedef {import('@loaders.gl/loader-utils').LoaderObject} LoaderObject */

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

const CSVLoaderOptions = {
  csv: {
    TableBatch: RowTableBatch,
    batchSize: 10,
    optimizeMemoryUsage: false,
    // CSV options
    header: 'auto',
    rowFormat: 'auto',
    columnPrefix: 'column',
    // delimiter: auto
    // newline: auto
    quoteChar: '"',
    escapeChar: '"',
    dynamicTyping: true,
    comments: false,
    skipEmptyLines: false,
    // transform: null?
    delimitersToGuess: [',', '\t', '|', ';']
    // fastMode: auto
  }
};

/** @type {LoaderObject} */
export const CSVLoader = {
  id: 'csv',
  name: 'CSV',
  version: VERSION,
  extensions: ['csv'],
  mimeTypes: ['text/csv'],
  category: 'table',
  parse: async (arrayBuffer, options) => parseCSV(new TextDecoder().decode(arrayBuffer), options),
  parseText: parseCSV,
  parseInBatches: parseCSVInBatches,
  // @ts-ignore
  testText: null,
  options: CSVLoaderOptions
};

async function parseCSV(csvText, options) {
  // Apps can call the parse method directly, we so apply default options here
  options = {...CSVLoaderOptions, ...options};
  options.csv = {...CSVLoaderOptions.csv, ...options.csv};

  const header = await hasHeader(csvText, options);

  const config = {
    dynamicTyping: true, // Convert numbers and boolean values in rows from strings
    ...options.csv,
    header,
    download: false, // We handle loading, no need for papaparse to do it for us
    error: e => {
      throw new Error(e);
    }
  };

  const result = Papa.parse(csvText, config);
  return result.data;
}

// TODO - support batch size 0 = no batching/single batch?
function parseCSVInBatches(asyncIterator, options) {
  // Apps can call the parse method directly, we so apply default options here
  options = {...CSVLoaderOptions, ...options};
  options.csv = {...CSVLoaderOptions.csv, ...options.csv};

  const {batchSize, optimizeMemoryUsage} = options.csv;
  const TableBatchType = options.csv.TableBatch;

  const asyncQueue = new AsyncQueue();

  const convertToObject = options.csv.rowFormat === 'object';

  let isFirstRow = true;
  let headerRow = null;
  let tableBatchBuilder = null;
  let schema = null;

  const config = {
    dynamicTyping: true, // Convert numbers and boolean values in rows from strings,
    ...options.csv,
    header: false, // Unfortunately, header detection is not automatic and does not infer types
    download: false, // We handle loading, no need for papaparse to do it for us
    // chunk(results, parser) {
    //   // TODO batch before adding to queue.
    //   console.log('Chunk:', results, parser);
    //   asyncQueue.enqueue(results.data);
    // },

    // step is called on every row
    step(results, parser) {
      const row = results.data;
      const bytesUsed = results.meta.cursor;

      // Check if we need to save a header row
      if (isFirstRow && !headerRow) {
        // Auto detects or can be forced with options.csv.header
        const header = isHeaderRow(row, options);
        if (header) {
          headerRow = row;
          return;
        }
      }

      // If first data row, we can deduce the schema
      if (isFirstRow) {
        isFirstRow = false;
        if (!headerRow) {
          headerRow = [];
          for (let i = 0; i < row.length; i++) {
            headerRow[i] = `${options.csv.columnPrefix}${i + 1}`;
          }
        }
        schema = deduceSchema(row, headerRow);
      }

      // Add the row
      tableBatchBuilder =
        tableBatchBuilder ||
        new TableBatchBuilder(TableBatchType, schema, {
          batchSize,
          convertToObject,
          optimizeMemoryUsage
        });

      tableBatchBuilder.addRow(row);
      // If a batch has been completed, emit it
      if (tableBatchBuilder.isFull()) {
        asyncQueue.enqueue(tableBatchBuilder.getBatch({bytesUsed}));
      }
    },

    // complete is called when all rows have been read
    complete(results, file) {
      const bytesUsed = results.meta.cursor;
      // Ensure any final (partial) batch gets emitted
      const batch = tableBatchBuilder.getBatch({bytesUsed});
      if (batch) {
        asyncQueue.enqueue(batch);
      }
      asyncQueue.close();
    }
  };

  Papa.parse(asyncIterator, config, AsyncIteratorStreamer);

  // TODO - Does it matter if we return asyncIterable or asyncIterator
  // return asyncQueue[Symbol.asyncIterator]();
  return asyncQueue;
}

function isHeaderRow(row, options) {
  if (options && options.csv.header !== 'auto') {
    return Boolean(options.csv.header);
  }

  return row.every(value => typeof value === 'string');
}

async function hasHeader(csvText, options) {
  if (options.csv.header !== 'auto') {
    return Boolean(options.csv.header);
  }

  return await new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      download: false,
      dynamicTyping: true,
      step: (results, parser) => {
        parser.abort();
        const row = results.data;
        // Test the row
        resolve(isHeaderRow(row));
      },
      error: e => {
        reject(new Error(e));
      }
    });
  });
}

function deduceSchema(row, headerRow) {
  const schema = headerRow ? {} : [];
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
