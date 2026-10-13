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
  const {GeoArrowLoaderWithParser} = await import('@loaders.gl/arrow/geoarrow-loader');
  const {preloadArrowCompressionDecoders} = await import('../lib/parsers/arrow-compression');
  await preloadArrowCompressionDecoders();
  return GeoArrowLoaderWithParser;
}

/** Metadata-only GeoArrow worker loader. */
export const GeoArrowWorkerLoader = {
  ...ArrowWorkerLoader,
  format: 'geoarrow',
  options: {
    arrow: {
      shape: 'arrow-table'
    }
  },
  preload
} as const satisfies Loader<ArrowTable | BinaryGeometry, ArrowTableBatch, GeoArrowLoaderOptions>;
