// loaders.gl, MIT license
import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import type {ParseBSONOptions} from './lib/parsers/parse-bson';
import {parseBSONSync} from './lib/parsers/parse-bson';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/**
 * @param table -
 * @param bsonpaths -
 */
export type BSONLoaderOptions = LoaderOptions & {
  bson?: ParseBSONOptions;
};

const DEFAULT_BSON_LOADER_OPTIONS = {
  bson: {}
};

export const BSONLoader: LoaderWithParser = {
  name: 'BSON',
  id: 'bson',
  module: 'bson',
  version: VERSION,
  extensions: ['bson'],
  mimeTypes: ['application/bson'],
  category: 'json',
  binary: true,
  parse,
  parseSync,
  options: DEFAULT_BSON_LOADER_OPTIONS
};

async function parse(arrayBuffer: ArrayBuffer, options?: BSONLoaderOptions) {
  const bsonOptions = {...DEFAULT_BSON_LOADER_OPTIONS.bson, ...options?.bson};
  return parseBSONSync(arrayBuffer, bsonOptions);
}

function parseSync(arrayBuffer: ArrayBuffer, options?: BSONLoaderOptions) {
  const bsonOptions = {...DEFAULT_BSON_LOADER_OPTIONS.bson, ...options?.bson};
  return parseBSONSync(arrayBuffer, bsonOptions);
}
