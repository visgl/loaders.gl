import type {LoaderWithParser} from '@loaders.gl/loader-utils';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

import {parsePGM} from '@math.gl/geoid';

/**
 * Loader for PGM - Netpbm grayscale image format
 */
export const PGMLoader: LoaderWithParser = {
  name: 'PGM - Netpbm grayscale image format',
  id: 'pgm',
  module: 'tile-converter',
  version: VERSION,
  mimeTypes: ['image/x-portable-graymap'],
  parse: async (arrayBuffer, options) => parsePGM(new Uint8Array(arrayBuffer), options),
  extensions: ['pgm'],
  options: {
    // TODO - use pgm namespace
    cubic: false
  }
};
