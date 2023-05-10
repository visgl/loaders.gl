import {LoaderOptions, LoaderWithParser} from '@loaders.gl/loader-utils';
import {parseSLPK} from './lib/parsers/parse-slpk/parse-slpk';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type SLPKLoaderOptions = LoaderOptions & {
  path?: string;
  mode?: 'http' | 'raw';
};

/**
 * Loader for SLPK - Scene Layer Package
 */
export const SLPKLoader: LoaderWithParser = {
  name: 'I3S SLPK (Scene Layer Package)',
  id: 'slpk',
  module: 'i3s',
  version: VERSION,
  mimeTypes: ['application/octet-stream'],
  parse: parseSLPK,
  extensions: ['slpk'],
  options: {}
};
