/* global __VERSION__ */ // __VERSION__ is injected by babel-plugin-version-inline
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

import DracoParser from './lib/draco-parser';

export const DracoWorkerLoader = {
  id: 'draco',
  name: 'DRACO',
  version: VERSION,
  extensions: ['drc'],
  mimeType: 'application/octet-stream',
  binary: true,
  test: 'DRACO',
  options: {
    draco: {
      workerUrl: `https://unpkg.com/@loaders.gl/draco@${VERSION}/dist/draco-loader.worker.js`
    }
  }
};

export const DracoLoader = {
  ...DracoWorkerLoader,
  parse: async (arrayBuffer, options) => parseSync(arrayBuffer, options),
  parseSync
};

function parseSync(arrayBuffer, options) {
  const dracoParser = new DracoParser();
  try {
    return dracoParser.parseSync(arrayBuffer, options);
  } finally {
    dracoParser.destroy();
  }
}
