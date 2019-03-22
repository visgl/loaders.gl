import parseSync from './lib/parse-arrow-sync';
import {parseArrowInBatches, parseArrowInBatchesSync} from './lib/parse-arrow-in-batches';

export default {
  name: 'Apache Arrow',
  extension: 'arrow',
  parseSync,
  parseInBatches: parseArrowInBatches,
  parseInBatchesSync: parseArrowInBatchesSync,
  DEFAULT_OPTIONS: {}
};
