// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import '@loaders.gl/polyfills';
import {Bench} from '@probe.gl/bench';

import {addModuleBenchmarksToSuite} from './modules';
import {installSortedGroupBenchOverride} from './group-sorted';

installSortedGroupBenchOverride(Bench);

const suite = new Bench({
  // Speed for CI testing
  minIterations: 1
});

addModuleBenchmarksToSuite(suite, process.argv.slice(2)).then(_ => suite.run());
