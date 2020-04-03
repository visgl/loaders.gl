require('reify');

/* eslint-disable @typescript-eslint/no-var-requires */

require('@loaders.gl/polyfills');
const {addModuleBenchmarksToSuite} = require('./modules');

const suite = new Bench({
  minIterations: 10
});

addModuleBenchmarksToSuite(suite).then(_ => suite.run());

require('./modules');
