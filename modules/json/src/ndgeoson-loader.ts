import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import parseNDJSONSync from './lib/parse-ndjson';
import parseNDJSONInBatches from './lib/parse-ndjson-in-batches';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type NDGeoJSONLoaderOptions = LoaderOptions & {
  geojson?: {
    shape?: 'object-row-table';
  };
  gis?: {
    format: 'geojson';
  };
};

const DEFAULT_NDGEOJSON_LOADER_OPTIONS = {
  geojson: {
    shape: 'object-row-table'
  },
  gis: {
    format: 'geojson'
  }
};

export const NDJSONLoader = {
  name: 'NDJSON',
  id: 'ndjson',
  module: 'json',
  version: VERSION,
  extensions: ['ndjson', 'ndgeojson'],
  mimeTypes: [
    'application/geo+x-ndjson',
    'application/geo+x-ldjson',
    'application/jsonlines', // https://docs.aws.amazon.com/sagemaker/latest/dg/cdf-inference.html#cm-batch
    'application/geo+json-seq',
    'application/x-ndjson'
  ],
  category: 'table',
  text: true,
  parse: async (arrayBuffer: ArrayBuffer) => parseNDJSONSync(new TextDecoder().decode(arrayBuffer)),
  parseTextSync: parseNDJSONSync,
  parseInBatches: parseNDJSONInBatches,
  options: DEFAULT_NDGEOJSON_LOADER_OPTIONS
};

export const _typecheckNDJSONLoader: LoaderWithParser = NDJSONLoader;
