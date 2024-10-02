// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import {fromArrayBuffer} from 'geotiff';
import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

// Type definitions
type GeoTiffData = {
  bounds: number[];
  width: number;
  height: number;
  imageData: ImageData;
};

interface GeoTiffLoaderOptions extends LoaderOptions {
  geotiff?: {
    enableAlpha?: boolean;
  };
}

/**
 * Loads a GeoTIFF file containing a RGB image.
 */
const loadGeoTiff = async (
  data: ArrayBuffer,
  options?: GeoTiffLoaderOptions
): Promise<GeoTiffData> => {
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
  const imageData = new ImageData(width, height);
  imageData.data.set(new Uint8ClampedArray(rgbData as unknown as Uint8Array));

  // Return GeoJSON data
  return {
    // TODO: Add bounds here
    bounds: [],
    imageData,
    width,
    height
  };
};

// /** @deprecated Double definition */
export const GeoTiffLoader = {
  dataType: null as unknown as GeoTiffData,
  batchType: null as never,

  id: 'geotiff',
  name: 'GeoTIFF',
  module: 'geotiff',
  version: VERSION,
  options: {
    geotiff: {
      enableAlpha: true
    }
  },
  mimeTypes: ['image/tiff', 'image/geotiff'],
  extensions: ['geotiff', 'tiff', 'geotif', 'tif'],
  parse: loadGeoTiff
} as const satisfies LoaderWithParser<GeoTiffData, never, GeoTiffLoaderOptions>;
