// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader} from '@loaders.gl/loader-utils';
import type {ArrowTable} from '@loaders.gl/schema';
import type {GPXLoaderOptions} from './gpx-loader';
import {GPXLoader} from './gpx-loader';

/** Options for `GPXArrowLoader`. */
export type GPXArrowLoaderOptions = GPXLoaderOptions;

/**
 * Metadata-only loader for GPX that returns Arrow tables with a WKB geometry column.
 */
export const GPXArrowLoader = {
  ...GPXLoader,
  name: 'GPX Arrow',
  id: 'gpx-arrow',
  dataType: null as unknown as ArrowTable,
  batchType: null as never,
  preload: async () => {
    const {GPXArrowLoaderWithParser} = await import('./gpx-arrow-loader-with-parser');
    return GPXArrowLoaderWithParser;
  }
} as const satisfies Loader<ArrowTable, never, GPXArrowLoaderOptions>;
