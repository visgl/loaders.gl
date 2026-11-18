// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader} from '@loaders.gl/core/loader-utils';
import type {Table} from 'apache-arrow';
import type {SplatsLoaderOptions} from './types';
import {SPZFormat} from './splats-format';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Preloads the parser-bearing SPZ loader implementation. */
async function preload() {
  const {SPZLoaderWithParser} = await import('./spz-loader');
  return SPZLoaderWithParser;
}

/** Metadata-only loader for Niantic Spatial `.spz` Gaussian splat files. */
export const SPZLoader = {
  defaultShape: 'arrow',
  supportsNativeArrow: true,
  dataType: null as unknown as Table,
  batchType: null as never,
  ...SPZFormat,
  version: VERSION,
  options: {
    splats: {
      shape: 'arrow'
    }
  },
  preload
} as const satisfies Loader<Table, never, SplatsLoaderOptions>;
