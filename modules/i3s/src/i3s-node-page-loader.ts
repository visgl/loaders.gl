// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {Loader} from '@loaders.gl/loader-utils';
import type {I3SLoaderOptions} from './i3s-loader';
import type {NodePage} from './types';

import {I3SNodePageFormat} from './i3s-format';
// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/**
 * Loader for I3S node pages
 */
export const I3SNodePageLoader = {
  ...I3SNodePageFormat,
  dataType: null as unknown as NodePage,
  batchType: null as never,

  name: 'I3S Node Page',
  id: 'i3s-node-page',
  module: 'i3s',
  version: VERSION,
  mimeTypes: ['application/json'],
  /** Loads the parser-bearing I3S node page loader implementation. */
  preload: async () =>
    (await import('./i3s-node-page-loader-with-parser')).I3SNodePageLoaderWithParser,
  extensions: ['json'],
  options: {
    i3s: {}
  }
} as const satisfies Loader<NodePage, never, I3SLoaderOptions>;
