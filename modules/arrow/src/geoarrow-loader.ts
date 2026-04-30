// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader} from '@loaders.gl/loader-utils';
import type {
  ArrowTable,
  ArrowTableBatch,
  GeoJSONTable,
  GeoJSONTableBatch
} from '@loaders.gl/schema';
import type {GeoArrowLoaderOptions} from './exports/geoarrow-loader';
import {GeoArrowWorkerLoader} from './exports/geoarrow-loader';

/**
 * Metadata-only GeoArrow loader for Apache Arrow tables with GeoArrow extension data.
 *
 * to convert it to a GeoJSON table or a BinaryGeometry
 */
async function preload() {
  const {GeoArrowLoaderWithParser} = await import('./geoarrow-loader-with-parser');
  return GeoArrowLoaderWithParser;
}

export const GeoArrowLoader = {
  ...GeoArrowWorkerLoader,
  preload
} as const satisfies Loader<
  ArrowTable | GeoJSONTable, // | BinaryGeometry,
  ArrowTableBatch | GeoJSONTableBatch, // | BinaryGeometry,
  GeoArrowLoaderOptions
>;
