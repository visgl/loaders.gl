import type {Batch} from '@loaders.gl/schema';
import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import parseJSONSync from './lib/parse-json';
import parseJSONInBatches from './lib/parse-json-in-batches';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/**
 * @param table -
 * @param jsonpaths -
 */
export type JSONLoaderOptions = LoaderOptions & {
  json?: {
    shape?: 'row-table';
    table?: false;
    jsonpaths?: string[];
  };
};

const DEFAULT_JSON_LOADER_OPTIONS = {
  json: {
    shape: 'row-table',
    table: false,
    jsonpaths: []
    // batchSize: 'auto'
  }
};

export const JSONLoader: LoaderWithParser = {
  name: 'JSON',
  id: 'json',
  module: 'json',
  version: VERSION,
  extensions: ['json', 'geojson'],
  mimeTypes: ['application/json'],
  category: 'table',
  text: true,
  parse,
  parseTextSync,
  parseInBatches,
  options: DEFAULT_JSON_LOADER_OPTIONS
};

async function parse(arrayBuffer: ArrayBuffer, options?: JSONLoaderOptions) {
  return parseTextSync(new TextDecoder().decode(arrayBuffer), options);
}

function parseTextSync(text: string, options?: JSONLoaderOptions) {
  const jsonOptions = {...options, json: {...DEFAULT_JSON_LOADER_OPTIONS.json, ...options?.json}};
  return parseJSONSync(text, jsonOptions as JSONLoaderOptions);
}

function parseInBatches(
  asyncIterator: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>,
  options?: JSONLoaderOptions
): AsyncIterable<Batch> {
  const jsonOptions = {...options, json: {...DEFAULT_JSON_LOADER_OPTIONS.json, ...options?.json}};
  return parseJSONInBatches(asyncIterator, jsonOptions as JSONLoaderOptions);
}
