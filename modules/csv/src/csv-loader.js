// __VERSION__ is injected by babel-plugin-version-inline
/* global __VERSION__ */
/* global TextDecoder */
import {AsyncQueue, TableBatchBuilder, RowTableBatch} from '@loaders.gl/tables';
import Papa from './libs/papaparse';
import AsyncIteratorStreamer from './lib/async-iterator-streamer';

// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

const CSVLoader = {
  id: 'csv',
  name: 'CSV',
  version: VERSION,
  extensions: ['csv'],
  mimeType: 'text/csv',
  category: 'table',
  parse: async (arrayBuffer, options) =>
    parseCSVSync(new TextDecoder().decode(arrayBuffer), options),
  parseTextSync: parseCSVSync,
  parseInBatches: parseCSVInBatches,
  testText: null,
  options: {
    csv: {
      TableBatch: RowTableBatch,
      batchSize: 10,
      header: true
    }
  }
};

export default CSVLoader;

function parseCSVSync(csvText, options) {
  // Apps can call the parse method directly, we so apply default options here
  options = {...CSVLoader.options, ...options};
  options.csv = {...CSVLoader.options.csv, ...options.csv};

  const config = {
    header: hasHeader(csvText, options),
    dynamicTyping: true, // Convert numbers and boolean values in rows from strings
    ...options.csv,
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
  options = {...CSVLoader.options, ...options};
  options.csv = {...CSVLoader.options.csv, ...options.csv};

  const {batchSize} = options.csv;
  const TableBatchType = options.csv.TableBatch;

  const asyncQueue = new AsyncQueue();
  //  convert the result to row object based on options.csv.header
  const convertToObject = Boolean(options.csv.header);

  let isFirstRow = true;
  let headerRow = null;
  let tableBatchBuilder = null;
  let schema = null;

  const config = {
    download: false, // We handle loading, no need for papaparse to do it for us
    dynamicTyping: true, // Convert numbers and boolean values in rows from strings
    header: false, // Unfortunately, header detection is not automatic and does not infer types
    // chunk(results, parser) {
    //   // TODO batch before adding to queue.
    //   console.log('Chunk:', results, parser);
    //   asyncQueue.enqueue(results.data);
    // },

    // step is called on every row
    step(results, parser) {
      const row = results.data;
      const meta = results.meta;

      // Check if we need to save a header row
      if (isFirstRow && !headerRow) {
        const header = options.header === undefined ? isHeaderRow(row) : options.header;
        if (header) {
          headerRow = row;
          return;
        }
      }

      // If first data row, we can deduce the schema
      if (isFirstRow) {
        isFirstRow = false;
        schema = deduceSchema(row, headerRow);
      }

      // Add the row
      tableBatchBuilder =
        tableBatchBuilder ||
        new TableBatchBuilder(TableBatchType, schema, {batchSize, convertToObject});

      tableBatchBuilder.addRow(row, meta.cursor);
      // If a batch has been completed, emit it
      if (tableBatchBuilder.isFull()) {
        asyncQueue.enqueue(tableBatchBuilder.getNormalizedBatch());
      }
    },

    // complete is called when all rows have been read
    complete(results, file) {
      // Ensure any final (partial) batch gets emitted
      const batch = tableBatchBuilder.getNormalizedBatch();
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

function isHeaderRow(row) {
  return row.every(value => typeof value === 'string');
}

function hasHeader(csvText, options) {
  if ('header' in options) {
    return options.header;
  }

  let header = false;
  Papa.parse(csvText, {
    download: false,
    dynamicTyping: true,
    step: (results, parser) => {
      const row = results.data;
      header = isHeaderRow(row);
      parser.abort();
    }
  });

  return header;
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
