import type {LoaderWithParser} from './types';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/**
 * A JSON Micro loader (minimal bundle size)
 * Alternative to `@loaders.gl/json`
 */
export const JSONLoader = {
  name: 'JSON',
  id: 'json',
  module: 'json',
  version: VERSION,
  extensions: ['json', 'geojson'],
  mimeTypes: ['application/json'],
  category: 'json',
  text: true,
  parseTextSync,
  parse: async (arrayBuffer) => parseTextSync(new TextDecoder().decode(arrayBuffer)),
  options: {}
};

// TODO - deprecated
function parseTextSync(text) {
  return JSON.parse(text);
}

export const _typecheckJSONLoader: LoaderWithParser = JSONLoader;
