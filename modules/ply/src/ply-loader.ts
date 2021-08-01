// PLY Loader
import type {Loader} from '@loaders.gl/loader-utils';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/**
 * Worker loader for PLY - Polygon File Format (aka Stanford Triangle Format)'
 * links: ['http://paulbourke.net/dataformats/ply/',
 * 'https://en.wikipedia.org/wiki/PLY_(file_format)']
 */
export const PLYLoader = {
  name: 'PLY',
  id: 'ply',
  module: 'ply',
  shapes: ['mesh', 'gltf', 'columnar-table'],
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

export const _typecheckPLYLoader: Loader = PLYLoader;
