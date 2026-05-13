// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';
import {ThreeTZFormat} from './tiles-3d-format';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** options to load data from 3tz */
export type Tiles3DArchiveFileLoaderOptions = LoaderOptions & {
  '3d-tiles-archive'?: {
    /** path inside the 3tz archive */
    path?: string;
  };
};

/**
 * Loader for 3tz packages
 */
export const Tiles3DArchiveFileLoader = {
  dataType: null as unknown as ArrayBuffer,
  batchType: null as never,
  ...ThreeTZFormat,
  name: '3tz',
  version: VERSION,
  /** Loads the parser-bearing 3tz archive loader implementation. */
  preload: async () =>
    (await import('./3d-tiles-archive-loader-with-parser')).Tiles3DArchiveFileLoaderWithParser,
  extensions: ['3tz'],
  options: {}
} satisfies Loader<ArrayBuffer, never, Tiles3DArchiveFileLoaderOptions>;
