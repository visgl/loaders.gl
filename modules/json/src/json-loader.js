import {RowTableBatch} from '@loaders.gl/tables';
import parseJSONSync from './lib/parse-json';
import parseJSONInBatches from './lib/parse-json-in-batches';
/** @typedef {import('@loaders.gl/loader-utils').LoaderObject} LoaderObject */

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

const JSONLoaderOptions = {
  json: {
    TableBatch: RowTableBatch,
    batchSize: 'auto',
    _rootObjectBatches: false,
    table: false,
    jsonpaths: []
  }
};

/** @type {LoaderObject} */
export const JSONLoader = {
  name: 'JSON',
  id: 'json',
  module: 'json',
  version: VERSION,
  extensions: ['json', 'geojson'],
  mimeTypes: ['application/json'],
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
  text: true,
  parse,
  parseTextSync,
  parseInBatches,
  options: JSONLoaderOptions,
  deprecatedOptions: {
    json: {
      _rootObjectBatches: 'metadata'
    }
  }
};

async function parse(arrayBuffer, options) {
  return parseTextSync(new TextDecoder().decode(arrayBuffer), options);
}

function parseTextSync(text, options) {
  // Apps can call the parse method directly, we so apply default options here
  options = {...JSONLoaderOptions, ...options};
  options.json = {...JSONLoaderOptions.json, ...options.json};
  return parseJSONSync(text, options);
}

async function parseInBatches(asyncIterator, options) {
  // Apps can call the parse method directly, we so apply default options here
  options = {...JSONLoaderOptions, ...options};
  options.json = {...JSONLoaderOptions.json, ...options.json};
  return parseJSONInBatches(asyncIterator, options);
}

/* TODO JSONL loader
{
  name: 'TEST-JSONL_LOADER',
  extensions: ['jsonl'],
  parse: async (arrayBuffer, options, context) => {
    const characters = new Uint8Array(arrayBuffer);
    const result = [];

    const len = characters.length;
    let startIndex = 0;
    for (let i = 0; i <= len; i++) {
      if (characters[i] === 10 || i === len) {
        // Note: we need to make a copy of the buffer here because we cannot
        // handover the ownership of arrayBuffer to the child process
        const json = characters.slice(startIndex, i);
        if (json.length > 1) {
          result.push(await context.parse(json.buffer, {}, 'line.json'));
        }
        startIndex = i + 1;
      }
    }

    return result;
  }
};
*/
