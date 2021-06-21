// LASER (LAS) FILE FORMAT
import type {Loader, LoaderWithParser} from '@loaders.gl/loader-utils';
import parseLAS from './lib/parse-las';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/**
 * Worker loader for the LAS (LASer) point cloud format
 */
export const LASWorkerLoader: Loader = {
  name: 'LAS',
  id: 'las',
  module: 'las',
  version: VERSION,
  worker: true,
  extensions: ['las', 'laz'], // LAZ is the "compressed" flavor of LAS,
  mimeTypes: ['application/octet-stream'], // TODO - text version?
  text: true,
  binary: true,
  tests: ['LAS'],
  options: {
    las: {
      fp64: false,
      skip: 1,
      colorDepth: 8
    }
  }
};

/**
 * Loader for the LAS (LASer) point cloud format
 */
export const LASLoader: LoaderWithParser = {
  ...LASWorkerLoader,
  parse: async (arrayBuffer, options) => parseLAS(arrayBuffer, options),
  parseSync: parseLAS
};
