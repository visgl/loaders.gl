import {LoaderWithParser} from '@loaders.gl/loader-utils';
import {parceSlpk} from './parse-slpk';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export const SlpkLoader: LoaderWithParser = {
  name: 'I3S (Indexed Scene Layers)',
  id: 'slpk',
  module: 'slpk',
  version: VERSION,
  mimeTypes: ['application/octet-stream'],
  parse: parceSlpk,
  extensions: ['slpk'],
  options: {}
};
