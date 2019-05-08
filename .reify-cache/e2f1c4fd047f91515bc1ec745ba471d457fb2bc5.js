"use strict";var parseSync;module.link('./lib/parse-arrow-sync',{default(v){parseSync=v}},0);var parseArrowInBatches,parseArrowInBatchesSync;module.link('./lib/parse-arrow-in-batches',{parseArrowInBatches(v){parseArrowInBatches=v},parseArrowInBatchesSync(v){parseArrowInBatchesSync=v}},1);


module.exportDefault({
  name: 'Apache Arrow',
  extensions: ['arrow'],
  parseSync,
  parseInBatches: parseArrowInBatches,
  parseInBatchesSync: parseArrowInBatchesSync,
  DEFAULT_OPTIONS: {}
});
