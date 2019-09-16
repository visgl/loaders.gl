import parseSync from './lib/parse-arrow-sync';
import {parseArrowInBatches, parseArrowInBatchesSync} from './lib/parse-arrow-in-batches';

export default {
  name: 'Apache Arrow',
  extensions: ['arrow'],
  mimeType: 'application/octet-stream',
  category: 'table',
  parse: async (arraybuffer, options) => parseSync(arraybuffer, options),
  parseSync,
  parseInBatches: parseArrowInBatches,
  parseInBatchesSync: parseArrowInBatchesSync,
  DEFAULT_OPTIONS: {}
};
