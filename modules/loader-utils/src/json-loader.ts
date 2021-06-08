import {LoaderObject} from './types';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/**
 * A JSON Micro loader (minimal bundle size)
 * Alternative to `@loaders.gl/json`
 */
export const JSONLoader: LoaderObject = {
  name: 'JSON',
  id: 'json',
  module: 'json',
  version: VERSION,
  extensions: ['json', 'geojson'],
  mimeTypes: ['application/json'],
  category: 'json',
  text: true,
  parseTextSync,
  parse: async (arrayBuffer, options) =>
    parseTextSync(new TextDecoder().decode(arrayBuffer), options),
  options: {}
};

// TODO - deprecated
function parseTextSync(text, options) {
  return JSON.parse(text);
}
