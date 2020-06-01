// __VERSION__ is injected by babel-plugin-version-inline
/* global __VERSION__ */
/* global TextDecoder */
import {RowTableBatch} from '@loaders.gl/tables';
import parseJSONSync from './lib/parse-json';
import parseJSONInBatches from './lib/parse-json-in-batches';

// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export const GeoJSONWorkerLoader = {
  id: 'geojson',
  name: 'GeoJSON',
  version: VERSION,
  extensions: ['geojson'],
  mimeType: 'application/geo+json',
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
  category: 'geometry',
  testText: null,
  text: true,
  options: {
    geojson: {
      TableBatch: RowTableBatch,
      batchSize: 'auto',
      workerUrl: `https://unpkg.com/@loaders.gl/json@${VERSION}/dist/geojson-loader.worker.js`
    }
  }
};

export const GeoJSONLoader = {
  ...GeoJSONWorkerLoader,
  parse,
  parseTextSync,
  parseInBatches
};

async function parse(arrayBuffer, options) {
  return parseTextSync(new TextDecoder().decode(arrayBuffer), options);
}

function parseTextSync(text, options) {
  // Apps can call the parse method directly, we so apply default options here
  options = {...GeoJSONLoader.options, ...options};
  options.json = {...GeoJSONLoader.options.geojson, ...options.geojson};
  return parseJSONSync(text, options);
}

async function parseInBatches(asyncIterator, options) {
  // Apps can call the parse method directly, we so apply default options here
  options = {...GeoJSONLoader.options, ...options};
  options.json = {...GeoJSONLoader.options.geojson, ...options.geojson};
  return parseJSONInBatches(asyncIterator, options);
}
