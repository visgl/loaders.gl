// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';

import {PotreeBinFormat} from './potree-format';
/**
 * Loader for potree Binary Point Attributes
 * */
export const PotreeBinLoader = {
  ...PotreeBinFormat,
  dataType: null as unknown as {},
  batchType: null as never,

  name: 'potree Binary Point Attributes',
  id: 'potree',
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
