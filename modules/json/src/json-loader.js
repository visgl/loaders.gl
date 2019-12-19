/* global __VERSION__ */ // __VERSION__ is injected by babel-plugin-version-inline
/* global TextDecoder */
import {TableBatchBuilder, RowTableBatch} from '@loaders.gl/tables';
import StreamingJSONParser from './lib/streaming-json-parser';

const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export const JSONLoader = {
  id: 'json',
  name: 'JSON',
  version: VERSION,
  extensions: ['json'],
  mimeType: 'text/json',
  /*
  extensions: {
    json: null,
    jsonl: {stream: true},
    ndjson: {stream: true}
  },
  mimeTypes: {
    'application/json': null,
    'application/json-seq': {stream: true},
    'application/x-ndjson': {stream: true}
  },
  */
  category: 'table',
  parse: async (arrayBuffer, options) =>
    parseJSONTextSync(new TextDecoder().decode(arrayBuffer), options),
  parseTextSync: parseJSONTextSync,
  parseInBatches: (asyncIterator, options) => parseJSONInBatches(asyncIterator, options),
  testText: null,
  text: true,
  options: {
    json: {
      TableBatch: RowTableBatch,
      batchSize: 'auto'
    }
  }
};

function parseJSONTextSync(jsonText, options) {
  // Apps can call the parse method directly, we so apply default options here
  options = {...JSONLoader.options, ...options};
  options.json = {...JSONLoader.options.json, ...options.json};

  try {
    const json = JSON.parse(jsonText);
    if (options.json.table) {
      return getFirstArray(json) || json;
    }
    return json;
  } catch (error) {
    throw new Error('JSONLoader: failed to parse JSON');
  }
}

function getFirstArray(json) {
  if (Array.isArray(json)) {
    return json;
  }
  if (json && typeof json === 'object') {
    for (const value of Object.values(json)) {
      const array = getFirstArray(value);
      if (array) {
        return array;
      }
    }
  }
  return null;
}

// TODO - support batch size 0 = no batching/single batch?
// eslint-disable-next-line max-statements
async function* parseJSONInBatches(asyncIterator, options) {
  // Apps can call the parse method directly, we so apply default options here
  options = {...JSONLoader.options, ...options};
  options.json = {...JSONLoader.options.json, ...options.json};

  const {batchSize} = options.json;
  const TableBatchType = options.json.TableBatch;

  let isFirstChunk = true;
  let tableBatchBuilder = null;
  let schema = null;

  const parser = new StreamingJSONParser();
  tableBatchBuilder = tableBatchBuilder || new TableBatchBuilder(TableBatchType, schema, batchSize);

  for await (const chunk of asyncIterator) {
    const rows = parser.write(chunk);

    if (isFirstChunk) {
      isFirstChunk = false;
      schema = deduceSchema(rows);
    }

    // Add the row
    for (const row of rows) {
      tableBatchBuilder.addRow(row);
      // If a batch has been completed, emit it
      if (tableBatchBuilder.isFull()) {
        yield tableBatchBuilder.getNormalizedBatch();
      }
    }

    tableBatchBuilder.chunkComplete();
    if (tableBatchBuilder.isFull()) {
      yield tableBatchBuilder.getNormalizedBatch();
    }
  }

  // yield final batch
  const batch = tableBatchBuilder.getNormalizedBatch();
  if (batch) {
    yield batch;
  }
}

function deduceSchema(rows) {
  const row = rows[0];

  const schema = {};
  let i = 0;
  for (const columnName in row) {
    const value = row[columnName];
    switch (typeof value) {
      case 'number':
      case 'boolean':
        // TODO - booleans could be handled differently...
        schema[columnName] = {name: String(columnName), index: i, type: Float32Array};
        break;

      case 'object':
        schema[columnName] = {name: String(columnName), index: i, type: Array};
        break;

      case 'string':
      default:
        schema[columnName] = {name: String(columnName), index: i, type: Array};
      // We currently only handle numeric rows
      // TODO we could offer a function to map strings to numbers?
    }
    i++;
  }
  return schema;
}
