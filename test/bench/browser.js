// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Bench} from '@probe.gl/bench';
import {_addAliases} from '@loaders.gl/loader-utils';
import ALIASES from '../aliases';
import {installSortedGroupBenchOverride} from './group-sorted';

installSortedGroupBenchOverride(Bench);

const {addModuleBenchmarksToSuite} = await import('./modules');

// Sets up aliases for file reader
_addAliases(ALIASES);

const suite = new Bench({
  minIterations: 1
});
const benchmarkFilters = new URLSearchParams(globalThis.location.search).getAll('module');

addModuleBenchmarksToSuite(suite, benchmarkFilters)
  .then(_ => suite.run())
  .then(() => globalThis.browserTestDriver_finish?.())
  .catch(error => {
    console.error(error);
    globalThis.browserTestDriver_fail?.();
    globalThis.browserTestDriver_finish?.(error.message);
  });
