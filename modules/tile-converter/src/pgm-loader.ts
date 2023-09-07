import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import {Geoid, parsePGM} from '@math.gl/geoid';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export {Geoid};

export type PGMLoaderOptions = LoaderOptions & {
  pgm?: {
    cubic?: boolean;
  };
};

/**
 * Loader for PGM - Netpbm grayscale image format
 */
export const PGMLoader: LoaderWithParser<Geoid, never, PGMLoaderOptions> = {
  name: 'PGM - Netpbm grayscale image format',
  id: 'pgm',
  module: 'tile-converter',
  version: VERSION,
  mimeTypes: ['image/x-portable-graymap'],
  parse: async (arrayBuffer, options) => parsePGM(new Uint8Array(arrayBuffer), options?.pgm || {}),
  extensions: ['pgm'],
  options: {
    pgm: {
      cubic: false
    }
  }
};
