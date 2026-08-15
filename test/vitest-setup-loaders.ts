// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {_addAliases} from '@loaders.gl/loader-utils';
import {setGlobalOptions} from '../modules/core/src/lib/loader-utils/option-utils';
import aliases from './aliases';

/** Installs repository fixture aliases and deterministic loader options for tests that need them. */
export function setupLoaderTestEnvironment(): void {
  _addAliases(aliases);
  setGlobalOptions({core: {_workerType: 'test', CDN: null, useLocalLibraries: true}});
}
