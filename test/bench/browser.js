// loaders.gl, MIT license
// Copyright (c) vis.gl contributors

import '@loaders.gl/polyfills';

import {Bench} from '@probe.gl/bench';
import {_addAliases} from '@loaders.gl/loader-utils';
import ALIASES from '../aliases';
import {addModuleBenchmarksToSuite} from './modules';

// Sets up aliases for file reader
_addAliases(ALIASES);

const suite = new Bench({
  minIterations: 1
});

addModuleBenchmarksToSuite(suite).then(_ => suite.run());
