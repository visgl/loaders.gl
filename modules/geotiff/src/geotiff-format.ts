// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Format} from '@loaders.gl/loader-utils';

/** GeoTIFF raster image format. */
export const GeoTIFFFormat = {
  id: 'geotiff',
  name: 'GeoTIFF',
  module: 'geotiff',
  encoding: 'image',
  format: 'geotiff',
  mimeTypes: ['image/tiff'],
  extensions: ['geotiff', 'tiff', 'geotif', 'tif']
} as const satisfies Format;

/** OME-TIFF raster image format. */
export const OMETiffFormat = {
  name: 'OME-TIFF',
  id: 'ometiff',
  module: 'geotiff',
  encoding: 'image',
  format: 'ome-tiff',
  extensions: ['ome.tif', 'ome.tiff'],
  mimeTypes: ['image/tiff', 'image/geotiff']
} as const satisfies Format;
