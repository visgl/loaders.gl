// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader} from '@loaders.gl/loader-utils';
import {GeoTIFFFormat} from './geotiff-format';
import type {GeoTIFFRasterData, GeoTIFFRasterLoaderOptions} from './geotiff-raster-types';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Loads the optional numeric TIFF parser on first use by an asynchronous core API. */
async function preload() {
  const {GeoTIFFRasterLoaderWithParser} = await import('@loaders.gl/geotiff/geotiff-raster-loader');
  return GeoTIFFRasterLoaderWithParser;
}

/** Metadata-only loader for original numeric TIFF bands and geospatial metadata. */
export const GeoTIFFRasterLoader = {
  ...GeoTIFFFormat,
  id: 'geotiff-raster',
  name: 'GeoTIFF Raster',
  version: VERSION,
  dataType: null as unknown as GeoTIFFRasterData,
  batchType: null as never,
  options: {geotiff: {}},
  preload
} as const satisfies Loader<GeoTIFFRasterData, never, GeoTIFFRasterLoaderOptions>;
