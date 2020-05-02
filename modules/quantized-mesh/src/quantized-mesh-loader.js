// __VERSION__ is injected by babel-plugin-version-inline
/* global __VERSION__ */
import parseQuantizedMesh from './lib/parse-quantized-mesh';

// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export const QuantizedMeshWorkerLoader = {
  id: 'quantized-mesh',
  name: 'Quantized Mesh',
  version: VERSION,
  extensions: ['terrain'],
  mimeType: 'application/vnd.quantized-mesh',
  options: {
    'quantized-mesh': {
      workerUrl: `https://unpkg.com/@loaders.gl/quantized-mesh@${VERSION}/dist/quantized-mesh-loader.worker.js`,
      bounds: [0, 0, 1, 1]
    }
  }
};

export const QuantizedMeshLoader = {
  ...QuantizedMeshWorkerLoader,
  parseSync: parseQuantizedMesh,
  parse: async (arrayBuffer, options) => parseQuantizedMesh(arrayBuffer, options)
};
