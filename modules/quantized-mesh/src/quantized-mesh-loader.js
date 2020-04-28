// __VERSION__ is injected by babel-plugin-version-inline
/* global __VERSION__ */
import loadQuantizedMesh from './lib/parse-terrain';

// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export const QuantizedMeshWorkerLoader = {
  id: 'quantized-mesh',
  name: 'Quantized Mesh',
  version: VERSION,
  extensions: ['terrain'],
  // mimeType: 'image/png',
  options: {}
};

export const QuantizedMeshLoader = {...QuantizedMeshWorkerLoader, parse: loadQuantizedMesh};
