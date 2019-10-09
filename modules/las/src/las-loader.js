// LASER (LAS) FILE FORMAT

/* global __VERSION__ */ // __VERSION__ is injected by babel-plugin-version-inline
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

import parseLAS from './lib/parse-las';

export const LASWorkerLoader = {
  id: 'las',
  name: 'LAS',
  version: VERSION,
  extensions: ['las', 'laz'], // LAZ is the "compressed" flavor of LAS,
  mimeType: 'application/octet-stream', // TODO - text version?
  text: true,
  binary: true,
  test: 'LAS',
  options: {
    las: {
      workerUrl: `https://unpkg.com/@loaders.gl/las@${VERSION}/dist/las-loader.worker.js`
    }
  }
};

export const LASLoader = {
  ...LASWorkerLoader,
  parse: async (arrayBuffer, options) => parseLAS(arrayBuffer, options),
  parseSync: parseLAS
};
