import type {Loader, LoaderWithParser} from '@loaders.gl/loader-utils';
import type {JSONLoaderOptions} from './json-loader';
import {geojsonToBinary} from '@loaders.gl/gis';
import parseJSONSync from './lib/parse-json';
import parseJSONInBatches from './lib/parse-json-in-batches';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type GeoJSONLoaderOptions = JSONLoaderOptions & {
  geojson?: {
    shape?: 'object-row-table';
  };
  gis?: {
    format?: 'geojson' | 'binary';
  };
};

const DEFAULT_GEOJSON_LOADER_OPTIONS = {
  geojson: {
    shape: 'object-row-table'
  },
  json: {
    jsonpaths: ['$', '$.features']
  },
  gis: {
    format: 'geojson'
  }
};

/**
 * GeoJSON loader
 */
export const GeoJSONWorkerLoader: Loader = {
  name: 'GeoJSON',
  id: 'geojson',
  module: 'geojson',
  version: VERSION,
  worker: true,
  extensions: ['geojson'],
  mimeTypes: ['application/geo+json'],
  category: 'geometry',
  text: true,
  options: DEFAULT_GEOJSON_LOADER_OPTIONS
};

export const GeoJSONLoader: LoaderWithParser = {
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
  options = {...DEFAULT_GEOJSON_LOADER_OPTIONS, ...options};
  options.json = {...DEFAULT_GEOJSON_LOADER_OPTIONS.geojson, ...options.geojson};
  options.gis = options.gis || {};
  const json = parseJSONSync(text, options);
  switch (options.gis.format) {
    case 'binary':
      return geojsonToBinary(json);
    default:
      return json;
  }
}

function parseInBatches(asyncIterator, options): AsyncIterable<any> {
  // Apps can call the parse method directly, we so apply default options here
  options = {...DEFAULT_GEOJSON_LOADER_OPTIONS, ...options};
  options.json = {...DEFAULT_GEOJSON_LOADER_OPTIONS.geojson, ...options.geojson};

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
