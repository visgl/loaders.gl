// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Bench} from '@probe.gl/bench';
import {_addAliases} from '@loaders.gl/loader-utils';
import ALIASES from '../aliases';

const {Buffer} = await import('buffer');
globalThis.Buffer = Buffer;
const {addModuleBenchmarksToSuite} = await import('./modules');

// Sets up aliases for file reader
_addAliases(ALIASES);

const suite = new Bench({
  minIterations: 1
});

addModuleBenchmarksToSuite(suite)
  .then(_ => suite.run())
  .then(() => globalThis.browserTestDriver_finish?.())
  .catch(error => {
    console.error(error);
    globalThis.browserTestDriver_fail?.();
    globalThis.browserTestDriver_finish?.(error.message);
  });
