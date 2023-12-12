// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TypedArray} from '@loaders.gl/loader-utils';
import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import {fromArrayBuffer} from 'geotiff';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

// Return type definition for GeoTIFF loader
type GeoTIFFData = {
  bounds: number[];
  geoKeys: Record<string, unknown>;

  width: number;
  height: number;
  data: TypedArray;
};

/** GeoTIFF load options */
export type GeoTIFFLoaderOptions = LoaderOptions & {
  geotiff?: {
    enableAlpha: boolean;
  };
};

/** GeoTIFF loader */
export const GeoTIFFLoader: LoaderWithParser<GeoTIFFData, never, GeoTIFFLoaderOptions> = {
  id: 'geotiff',
  name: 'GeoTIFF',
  module: 'geotiff',
  version: VERSION,
  options: {
    enableAlpha: true
  },
  mimeTypes: ['image/tiff', 'image/geotiff'],
  extensions: ['geotiff', 'tiff', 'geotif', 'tif'],
  parse: parseGeoTIFF
};

/**
 * Loads a GeoTIFF file containing a RGB image.
 */
async function parseGeoTIFF(
  data: ArrayBuffer,
  options?: GeoTIFFLoaderOptions
): Promise<GeoTIFFData> {
  // Load using Geotiff.js
  const tiff = await fromArrayBuffer(data);

  // Assumes we only have one image inside TIFF
  const image = await tiff.getImage();

  // Read image and size
  // TODO: Add support for worker pools here.
  // TODO: Add support for more image formats.
  const rgbData = await image.readRGB({
    enableAlpha: options?.geotiff?.enableAlpha
  });

  const width = image.getWidth();
  const height = image.getHeight();

  // Create a new ImageData object
  const imageData = new Uint8ClampedArray(rgbData as unknown as Uint8Array);

  // Get geo data
  const bounds = image.getBoundingBox();
  const geoKeys = image.getGeoKeys();

  // Return GeoReferenced image data
  return {
    bounds,
    width,
    height,
    data: imageData,
    geoKeys
  };
}
