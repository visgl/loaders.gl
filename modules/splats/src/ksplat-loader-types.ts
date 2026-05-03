// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader} from '@loaders.gl/loader-utils';
import type {MeshArrowTable} from '@loaders.gl/schema';
import type {SplatsLoaderOptions} from './types';
import {KSPLATFormat} from './splats-format';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Preloads the parser-bearing KSPLAT loader implementation. */
async function preload() {
  const {KSPLATLoaderWithParser} = await import('./ksplat-loader');
  return KSPLATLoaderWithParser;
}

/** Metadata-only loader for `.ksplat` Gaussian splat files. */
export const KSPLATLoader = {
  dataType: null as unknown as MeshArrowTable,
  batchType: null as never,
  ...KSPLATFormat,
  version: VERSION,
  options: {
    splats: {
      shape: 'arrow-table'
    }
  },
  preload
} as const satisfies Loader<MeshArrowTable, never, SplatsLoaderOptions>;
