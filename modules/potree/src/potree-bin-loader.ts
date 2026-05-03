// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';

import {PotreeBinFormat} from './potree-format';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/**
 * Loader for potree Binary Point Attributes
 * */
export const PotreeBinLoader = {
  ...PotreeBinFormat,
  dataType: null as unknown as {},
  batchType: null as never,

  name: 'potree Binary Point Attributes',
  id: 'potree',
  module: 'potree',
  version: VERSION,
  extensions: ['bin'],
  mimeTypes: ['application/octet-stream'],
  // Unfortunately binary potree files have no header bytes, no test possible
  // test: ['...'],
  /** Loads the parser-bearing potree binary attribute loader implementation. */
  preload: async () => (await import('./potree-bin-loader-with-parser')).PotreeBinLoaderWithParser,
  binary: true,
  options: {}
  // @ts-ignore
} as const satisfies Loader<{}, never, LoaderOptions>;
