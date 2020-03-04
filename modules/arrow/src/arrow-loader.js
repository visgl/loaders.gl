// __VERSION__ is injected by babel-plugin-version-inline
/* global __VERSION__ */
import parseSync from './lib/parse-arrow-sync';
import {parseArrowInBatches, parseArrowInBatchesSync} from './lib/parse-arrow-in-batches';

// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export const ArrowWorkerLoader = {
  id: 'arrow',
  name: 'Apache Arrow',
  category: 'table',
  version: VERSION,
  extensions: ['arrow'],
  mimeType: 'application/octet-stream',
  test: 'ARRO',
  binary: true,
  options: {
    arrow: {
      workerUrl: `https://unpkg.com/@loaders.gl/arrow@${VERSION}/dist/arrow-loader.worker.js`
    }
  }
};

export const ArrowLoader = {
  ...ArrowWorkerLoader,
  parse: async (arraybuffer, options) => parseSync(arraybuffer, options),
  parseSync,
  parseInBatches: parseArrowInBatches,
  parseInBatchesSync: parseArrowInBatchesSync
};
