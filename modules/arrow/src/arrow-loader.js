/* global __VERSION__ */ // __VERSION__ is injected by babel-plugin-version-inline
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

import parseSync from './lib/parse-arrow-sync';
import {parseArrowInBatches, parseArrowInBatchesSync} from './lib/parse-arrow-in-batches';

const ARROW = {
  id: 'arrow',
  name: 'Apache Arrow',
  version: VERSION,
  extensions: ['arrow'],
  mimeType: 'application/octet-stream',
  category: 'table'
};

export const ArrowLoader = {
  ...ARROW,
  parse: async (arraybuffer, options) => parseSync(arraybuffer, options),
  parseSync,
  parseInBatches: parseArrowInBatches,
  parseInBatchesSync: parseArrowInBatchesSync,
  options: {}
};

export const ArrowWorkerLoader = {
  ...ARROW,
  options: {
    arrow: {
      workerUrl: `https://unpkg.com/@loaders.gl/arrow@${VERSION}/dist/arrow-loader.worker.js`
    }
  }
};
