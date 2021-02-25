/* global TextDecoder */
/** @typedef {import('@loaders.gl/loader-utils').LoaderObject} LoaderObject */
/** @typedef {import('@loaders.gl/loader-utils').WorkerLoaderObject} WorkerLoaderObject */
import {RowTableBatch} from '@loaders.gl/tables';
import {geojsonToBinary} from '@loaders.gl/gis';
import parseJSONSync from './lib/parse-json';
import parseJSONInBatches from './lib/parse-json-in-batches';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

const GeoJSONLoaderOptions = {
  geojson: {
    TableBatch: RowTableBatch,
    batchSize: 'auto'
  },
  json: {
    jsonpaths: ['$', '$.features']
  },
  gis: {
    format: 'geojson'
  }
};

/**
 * @type {WorkerLoaderObject}
 */
export const GeoJSONWorkerLoader = {
  name: 'GeoJSON',
  id: 'geojson',
  module: 'geojson',
  version: VERSION,
  worker: true,
  extensions: ['geojson'],
  mimeTypes: ['application/geo+json'],
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
  text: true,
  options: GeoJSONLoaderOptions
};

/** @type {LoaderObject} */
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
  options = {...GeoJSONLoaderOptions, ...options};
  options.json = {...GeoJSONLoaderOptions.geojson, ...options.geojson};
  options.gis = options.gis || {};
  const json = parseJSONSync(text, options);
  switch (options.gis.format) {
    case 'binary':
      return geojsonToBinary(json);
    default:
      return json;
  }
}

async function parseInBatches(asyncIterator, options) {
  // Apps can call the parse method directly, we so apply default options here
  options = {...GeoJSONLoaderOptions, ...options};
  options.json = {...GeoJSONLoaderOptions.geojson, ...options.geojson};

  const geojsonIterator = parseJSONInBatches(asyncIterator, options);

  switch (options.gis.format) {
    case 'binary':
      return makeBinaryGeometryIterator(geojsonIterator);
    default:
      return geojsonIterator;
  }
}

async function* makeBinaryGeometryIterator(geojsonIterator) {
  for await (const batch of geojsonIterator) {
    batch.data = geojsonToBinary(batch.data);
    yield batch;
  }
}
