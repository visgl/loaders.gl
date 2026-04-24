// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader} from '@loaders.gl/loader-utils';
import type {ArrowTable} from '@loaders.gl/schema';

import {PCDLoaderOptions, PCDWorkerLoader} from './pcd-loader';

/**
 * Preloads the parser-bearing PCD Arrow loader implementation.
 */
async function preload() {
  const {PCDArrowLoaderWithParser} = await import('./pcd-arrow-loader-with-parser');
  return PCDArrowLoaderWithParser;
}

/**
 * Metadata-only loader for PCD - Point Cloud Data
 */
export const PCDArrowLoader = {
  ...PCDWorkerLoader,
  dataType: null as unknown as ArrowTable,
  batchType: null as never,
  worker: false,
  preload
} as const satisfies Loader<ArrowTable, never, PCDLoaderOptions>;
