// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader} from '@loaders.gl/loader-utils';
import type {ArrowTable} from '@loaders.gl/schema';

import type {LASLoaderOptions} from './las-loader';
import {LAZPerfLoader} from './lazperf-loader';

/**
 * Metadata-only loader for LAS point clouds as Apache Arrow tables.
 */
export const LASArrowLoader = {
  ...LAZPerfLoader,
  dataType: null as unknown as ArrowTable,
  batchType: null as never,
  worker: false,
  preload: async () => {
    const {LASArrowLoaderWithParser} = await import('./las-arrow-loader-with-parser');
    return LASArrowLoaderWithParser;
  }
} as const satisfies Loader<ArrowTable, never, LASLoaderOptions>;
