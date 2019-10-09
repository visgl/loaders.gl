/* global __VERSION__ */ // __VERSION__ is injected by babel-plugin-version-inline
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

import parsePCDSync from './lib/parse-pcd';

export const PCDWorkerLoader = {
  id: 'pcd',
  name: 'PCD',
  version: VERSION,
  extensions: ['pcd'],
  mimeType: 'text/plain',
  options: {
    pcd: {
      workerUrl: `https://unpkg.com/@loaders.gl/pcd@${VERSION}/dist/pcd-loader.worker.js`
    }
  }
};

export const PCDLoader = {
  ...PCDWorkerLoader,
  parse: async (arrayBuffer, options) => parsePCDSync(arrayBuffer, options),
  parseSync: parsePCDSync
};
