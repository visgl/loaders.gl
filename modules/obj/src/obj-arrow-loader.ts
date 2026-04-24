// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader} from '@loaders.gl/loader-utils';
import type {ArrowTable} from '@loaders.gl/schema';

import {OBJLoaderOptions, OBJWorkerLoader} from './obj-loader';

/**
 * Preloads the parser-bearing OBJ Arrow loader implementation.
 */
async function preload() {
  const {OBJArrowLoaderWithParser} = await import('./obj-arrow-loader-with-parser');
  return OBJArrowLoaderWithParser;
}

/**
 * Metadata-only loader for OBJ - Point Cloud Data
 */
export const OBJArrowLoader = {
  ...OBJWorkerLoader,
  dataType: null as unknown as ArrowTable,
  batchType: null as never,
  worker: false,
  preload
} as const satisfies Loader<ArrowTable, never, OBJLoaderOptions>;
