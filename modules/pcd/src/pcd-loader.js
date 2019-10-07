/* global __VERSION__ */ // __VERSION__ is injected by babel-plugin-version-inline
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

import parsePCDSync from './lib/parse-pcd';

const PCD = {
  id: 'pcd',
  name: 'PCD',
  version: __VERSION__,
  extensions: ['pcd'],
  mimeType: 'text/plain'
};

export const PCDLoader = {
  ...PCD,
  parse: async (arrayBuffer, options) => parsePCDSync(arrayBuffer, options),
  parseSync: parsePCDSync,
  options: {
    pcd: {}
  }
};

export const PCDWorkerLoader = {
  ...PCD,
  options: {
    pcd: {
      workerUrl: `https://unpkg.com/@loaders.gl/pcd@${VERSION}/dist/pcd-loader.worker.js`
    }
  }
};
