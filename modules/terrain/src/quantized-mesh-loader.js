/** @typedef {import('@loaders.gl/loader-utils').LoaderObject} LoaderObject */
/** @typedef {import('@loaders.gl/loader-utils').WorkerLoaderObject} WorkerLoaderObject */
import parseQuantizedMesh from './lib/parse-quantized-mesh';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** @type {WorkerLoaderObject} */
export const QuantizedMeshWorkerLoader = {
  id: 'quantized-mesh',
  name: 'Quantized Mesh',
  version: VERSION,
  extensions: ['terrain'],
  mimeTypes: ['application/vnd.quantized-mesh'],
  options: {
    'quantized-mesh': {
      workerUrl: `https://unpkg.com/@loaders.gl/terrain@${VERSION}/dist/quantized-mesh-loader.worker.js`,
      bounds: [0, 0, 1, 1]
    }
  }
};

/** @type {LoaderObject} */
export const QuantizedMeshLoader = {
  ...QuantizedMeshWorkerLoader,
  parseSync: parseQuantizedMesh,
  parse: async (arrayBuffer, options) => parseQuantizedMesh(arrayBuffer, options)
};
