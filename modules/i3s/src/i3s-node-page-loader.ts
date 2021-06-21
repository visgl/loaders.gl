import type {LoaderWithParser} from '@loaders.gl/loader-utils';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

async function parseNodePage(data) {
  return JSON.parse(new TextDecoder().decode(data));
}

/**
 * Loader for I3S node pages
 */
export const I3SNodePageLoader: LoaderWithParser = {
  name: 'I3S Node Page',
  id: 'i3s-node-page',
  module: 'i3s',
  version: VERSION,
  mimeTypes: ['application/json'],
  parse,
  extensions: ['json'],
  options: {}
};

async function parse(data) {
  data = parseNodePage(data);
  return data;
}
