// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader} from '@loaders.gl/loader-utils';
import type {ArrowTable} from '@loaders.gl/schema';
import {ORCFormat} from './orc-format';

// __VERSION__ is injected by babel-plugin-version-inline.
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Options for the minimal ORC loader. */
export type ORCLoaderOptions = {
  /** Optional codec implementations injected into the compression module. */
  modules?: Record<string, any>;
};

/** Preloads the parser-bearing ORC loader implementation. */
async function preloadORCLoader() {
  const {ORCLoaderWithParser} = await import('@loaders.gl/orc/orc-loader');
  return ORCLoaderWithParser;
}

/** Metadata-only loader for Apache ORC files. */
export const ORCLoader = {
  ...ORCFormat,
  version: VERSION,
  dataType: null as unknown as ArrowTable,
  batchType: null as never,
  worker: false,
  options: {},
  preload: preloadORCLoader
} as const satisfies Loader<ArrowTable, never, ORCLoaderOptions>;
