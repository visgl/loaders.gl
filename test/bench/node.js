import '@loaders.gl/polyfills';
import {Bench} from '@probe.gl/bench';

import {addModuleBenchmarksToSuite} from './modules';

const suite = new Bench({
  // Speed for CI testing
  minIterations: 1
});

addModuleBenchmarksToSuite(suite).then(_ => suite.run());
