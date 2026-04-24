// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader} from '@loaders.gl/loader-utils';
import type {ArrowTable} from '@loaders.gl/schema';

import {PLYLoaderOptions, PLYWorkerLoader} from './ply-loader';

/**
 * Preloads the parser-bearing PLY Arrow loader implementation.
 */
async function preload() {
  const {PLYArrowLoaderWithParser} = await import('./ply-arrow-loader-with-parser');
  return PLYArrowLoaderWithParser;
}

/**
 * Metadata-only loader for PLY -
 */
export const PLYArrowLoader = {
  ...PLYWorkerLoader,
  dataType: null as unknown as ArrowTable,
  batchType: null as never,
  worker: false,
  preload
} as const satisfies Loader<ArrowTable, never, PLYLoaderOptions>;
