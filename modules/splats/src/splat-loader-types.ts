// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader} from '@loaders.gl/loader-utils';
import type {MeshArrowTable} from '@loaders.gl/schema';
import type {SplatsLoaderOptions} from './types';
import {SPLATFormat} from './splats-format';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Preloads the parser-bearing SPLAT loader implementation. */
async function preload() {
  const {SPLATLoaderWithParser} = await import('./splat-loader');
  return SPLATLoaderWithParser;
}

/** Metadata-only loader for raw `.splat` Gaussian splat files. */
export const SPLATLoader = {
  dataType: null as unknown as MeshArrowTable,
  batchType: null as never,
  ...SPLATFormat,
  version: VERSION,
  options: {
    splats: {
      shape: 'arrow-table'
    }
  },
  preload
} as const satisfies Loader<MeshArrowTable, never, SplatsLoaderOptions>;
