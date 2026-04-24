// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader, LoaderOptions} from '@loaders.gl/loader-utils';
import type {ArrowTable, ArrowTableBatch, BinaryGeometry} from '@loaders.gl/schema';
import {ArrowWorkerLoader} from './arrow-loader';

export type GeoArrowLoaderOptions = LoaderOptions & {
  arrow?: {
    shape?: 'arrow-table' | 'binary-geometry';
  };
};

/** Preloads the parser-bearing GeoArrow loader implementation. */
async function preload() {
  const {GeoArrowLoaderWithParser} = await import('../geoarrow-loader-with-parser');
  return GeoArrowLoaderWithParser;
}

/** Metadata-only GeoArrow worker loader. */
export const GeoArrowWorkerLoader = {
  ...ArrowWorkerLoader,
  options: {
    arrow: {
      shape: 'arrow-table'
    }
  },
  preload
} as const satisfies Loader<ArrowTable | BinaryGeometry, ArrowTableBatch, GeoArrowLoaderOptions>;
