// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type POTreeLoaderOptions = LoaderOptions & {
  potree?: {};
};

/** Preloads the parser-bearing Potree loader implementation. */
async function preload() {
  const {PotreeLoaderWithParser} = await import('./potree-loader-with-parser');
  return PotreeLoaderWithParser;
}

/** Metadata-only Potree loader. */
export const PotreeLoader = {
  dataType: null as unknown as any,
  batchType: null as never,

  name: 'potree metadata',
  id: 'potree',
  module: 'potree',
  version: VERSION,
  text: true,
  extensions: ['js'],
  mimeTypes: ['application/json'],
  testText: text => text.indexOf('octreeDir') >= 0,
  options: {
    potree: {}
  },
  preload
} as const satisfies Loader<any, never, POTreeLoaderOptions>;
