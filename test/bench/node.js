require('reify');
require('@loaders.gl/polyfills');
const {Bench} = require('@probe.gl/bench');

const {addModuleBenchmarksToSuite} = require('./modules');

const suite = new Bench({
  // Speed for CI testing
  minIterations: 1
});

addModuleBenchmarksToSuite(suite).then(_ => suite.run());
