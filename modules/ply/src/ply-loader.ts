// description: 'PLY - Polygon File Format (aka Stanford Triangle Format)'
// links: ['http://paulbourke.net/dataformats/ply/',
// 'https://en.wikipedia.org/wiki/PLY_(file_format)']

import type {Loader, LoaderWithParser} from '@loaders.gl/loader-utils';
import parsePLY from './lib/parse-ply';
import parsePLYInBatches from './lib/parse-ply-in-batches';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/**
 * Worker loader for PLY - Polygon File Format
 */
export const PLYWorkerLoader: Loader = {
  name: 'PLY',
  id: 'ply',
  module: 'ply',
  version: VERSION,
  worker: true,
  extensions: ['ply'],
  mimeTypes: ['text/plain', 'application/octet-stream'],
  text: true,
  binary: true,
  tests: ['ply'],
  options: {
    ply: {}
  }
};

/**
 * Loader for PLY - Polygon File Format
 */
export const PLYLoader: LoaderWithParser = {
  ...PLYWorkerLoader,
  // Note: parsePLY supports both text and binary
  parse: async (arrayBuffer, options) => parsePLY(arrayBuffer, options), // TODO - this may not detect text correctly?
  parseTextSync: parsePLY,
  parseSync: parsePLY,
  parseInBatches: parsePLYInBatches
};
