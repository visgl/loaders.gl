// LASER (LAS) FILE FORMAT

/* global __VERSION__ */ // __VERSION__ is injected by babel-plugin-version-inline

import parseLAS from './lib/parse-las';

const LAS = {
  id: 'las',
  name: 'LAS',
  extensions: ['las', 'laz'], // LAZ is the "compressed" flavor of LAS,
  mimeType: 'application/octet-stream', // TODO - text version?
  text: true,
  binary: true,
  test: 'LAS'
};

export const LASLoader = {
  ...LAS,
  parse: async (arrayBuffer, options) => parseLAS(arrayBuffer, options),
  parseSync: parseLAS,
  options: {}
};

export const LASWorkerLoader = {
  ...LAS,
  options: {
    las: {
      workerUrl: `https://unpkg.com/@loaders.gl/las@${__VERSION__}/dist/las-loader.worker.js`
    }
  }
};
