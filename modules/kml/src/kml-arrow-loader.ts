// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader} from '@loaders.gl/loader-utils';
import type {ArrowTable} from '@loaders.gl/schema';
import type {KMLLoaderOptions} from './kml-loader';
import {KMLLoader} from './kml-loader';

/** Options for `KMLArrowLoader`. */
export type KMLArrowLoaderOptions = KMLLoaderOptions;

/**
 * Metadata-only loader for KML that returns Arrow tables with a WKB geometry column.
 */
export const KMLArrowLoader = {
  ...KMLLoader,
  name: 'KML Arrow',
  id: 'kml-arrow',
  dataType: null as unknown as ArrowTable,
  batchType: null as never,
  preload: async () => {
    const {KMLArrowLoaderWithParser} = await import('./kml-arrow-loader-with-parser');
    return KMLArrowLoaderWithParser;
  }
} as const satisfies Loader<ArrowTable, never, KMLArrowLoaderOptions>;
