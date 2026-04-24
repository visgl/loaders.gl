// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader} from '@loaders.gl/loader-utils';
import type {ArrowTable} from '@loaders.gl/schema';
import type {TCXLoaderOptions} from './tcx-loader';
import {TCXLoader} from './tcx-loader';

/** Options for `TCXArrowLoader`. */
export type TCXArrowLoaderOptions = TCXLoaderOptions;

/**
 * Metadata-only loader for TCX that returns Arrow tables with a WKB geometry column.
 */
export const TCXArrowLoader = {
  ...TCXLoader,
  name: 'TCX Arrow',
  id: 'tcx-arrow',
  dataType: null as unknown as ArrowTable,
  batchType: null as never,
  preload: async () => {
    const {TCXArrowLoaderWithParser} = await import('./tcx-arrow-loader-with-parser');
    return TCXArrowLoaderWithParser;
  }
} as const satisfies Loader<ArrowTable, never, TCXArrowLoaderOptions>;
