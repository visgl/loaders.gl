/* global __VERSION__ */ // __VERSION__ is injected by babel-plugin-version-inline

import DracoParser from './lib/draco-parser';

const DRACO = {
  id: 'draco',
  name: 'DRACO',
  extensions: ['drc'],
  mimeType: 'application/octet-stream',
  binary: true,
  test: 'DRACO'
};

export const DracoLoader = {
  ...DRACO,
  parse: async (arrayBuffer, options) => parseSync(arrayBuffer, options),
  parseSync,
  options: {}
};

export const DracoWorkerLoader = {
  ...DRACO,
  options: {
    draco: {
      workerUrl: `https://unpkg.com/@loaders.gl/draco@${__VERSION__}/dist/draco-loader.worker.js`
    }
  }
};

function parseSync(arrayBuffer, options) {
  const dracoParser = new DracoParser();
  try {
    return dracoParser.parseSync(arrayBuffer, options);
  } finally {
    dracoParser.destroy();
  }
}
