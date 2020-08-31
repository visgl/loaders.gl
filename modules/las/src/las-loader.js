// LASER (LAS) FILE FORMAT
/** @typedef {import('@loaders.gl/loader-utils').LoaderObject} LoaderObject */
/** @typedef {import('@loaders.gl/loader-utils').WorkerLoaderObject} WorkerLoaderObject */
import parseLAS from './lib/parse-las';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** @type {WorkerLoaderObject} */
export const LASWorkerLoader = {
  id: 'las',
  name: 'LAS',
  version: VERSION,
  extensions: ['las', 'laz'], // LAZ is the "compressed" flavor of LAS,
  mimeTypes: ['application/octet-stream'], // TODO - text version?
  text: true,
  binary: true,
  tests: ['LAS'],
  options: {
    las: {
      workerUrl: `https://unpkg.com/@loaders.gl/las@${VERSION}/dist/las-loader.worker.js`,
      skip: 1,
      colorDepth: 8
    }
  }
};

/** @type {LoaderObject} */
export const LASLoader = {
  ...LASWorkerLoader,
  parse: async (arrayBuffer, options) => parseLAS(arrayBuffer, options),
  parseSync: parseLAS
};
