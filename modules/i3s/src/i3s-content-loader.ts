// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {Loader} from '@loaders.gl/loader-utils';
import type {I3SLoaderOptions} from './i3s-loader';
import type {I3STileContent} from './types';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.

const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/**
 * Loader for I3S - Indexed 3D Scene Layer
 */
export const I3SContentLoader = {
  dataType: null as unknown as I3STileContent | null,
  batchType: null as never,

  name: 'I3S Content (Indexed Scene Layers)',
  id: 'i3s-content',
  module: 'i3s',
  worker: true,
  workerFile: 'i3s-classic.js',
  workerModuleFile: 'i3s-module.js',
  workerNodeFile: 'i3s-classic-node.cjs',
  version: VERSION,
  mimeTypes: ['application/octet-stream'],
  /** Loads the parser-bearing I3S content loader implementation. */
  preload: async () =>
    (await import('./i3s-content-loader-with-parser')).I3SContentLoaderWithParser,
  extensions: ['bin'],
  options: {
    'i3s-content': {}
  }
} as const satisfies Loader<I3STileContent | null, never, I3SLoaderOptions>;
