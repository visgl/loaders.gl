// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type POTreeLoaderOptions = LoaderOptions & {
  potree?: {};
};

/** Potree loader */
export const PotreeLoader = {
  dataType: null as unknown as any,
  batchType: null as never,

  name: 'potree metadata',
  id: 'potree',
  module: 'potree',
  version: VERSION,
  extensions: ['js'],
  mimeTypes: ['application/json'],
  testText: (text) => text.indexOf('octreeDir') >= 0,
  parse: (data: ArrayBuffer) => JSON.parse(new TextDecoder().decode(data)),
  parseTextSync: (text) => JSON.parse(text),
  options: {
    potree: {}
  }
} as const satisfies LoaderWithParser<any, never, POTreeLoaderOptions>;
