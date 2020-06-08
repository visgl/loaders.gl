// __VERSION__ is injected by babel-plugin-version-inline
/* global __VERSION__ */
/* global TextDecoder */
import {RowTableBatch} from '@loaders.gl/tables';
import parseJSONSync from './lib/parse-json';
import parseJSONInBatches from './lib/parse-json-in-batches';

// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export const JSONLoader = {
  id: 'json',
  name: 'JSON',
  version: VERSION,
  extensions: ['json', 'geojson'],
  mimeType: 'text/json',
  // TODO - support various line based JSON formats
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
  testText: null,
  text: true,
  parse,
  parseTextSync,
  parseInBatches,
  options: {
    json: {
      TableBatch: RowTableBatch,
      batchSize: 'auto'
    }
  }
};

async function parse(arrayBuffer, options) {
  return parseTextSync(new TextDecoder().decode(arrayBuffer), options);
}

function parseTextSync(text, options) {
  // Apps can call the parse method directly, we so apply default options here
  options = {...JSONLoader.options, ...options};
  options.json = {...JSONLoader.options.json, ...options.json};
  return parseJSONSync(text, options);
}

async function parseInBatches(asyncIterator, options) {
  // Apps can call the parse method directly, we so apply default options here
  options = {...JSONLoader.options, ...options};
  options.json = {...JSONLoader.options.json, ...options.json};
  return parseJSONInBatches(asyncIterator, options);
}
