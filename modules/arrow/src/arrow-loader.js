import parseSync from './parse-arrow-sync';
import {parseArrowInBatches, parseArrowInBatchesSync} from './parse-arrow-async-iterator';

export default {
  name: 'Apache Arrow',
  extension: 'arrow',
  parseSync,
  parseInBatches: parseArrowInBatches,
  parseInBatchesSync: parseArrowInBatchesSync,
  DEFAULT_OPTIONS: {}
};
