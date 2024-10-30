// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TypedArray, LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import {fromArrayBuffer} from 'geotiff';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

// Return type definition for GeoTIFF loader
type GeoTIFFData = {
  crs?: string;
  bounds: number[];
  metadata: Record<string, unknown>;

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
export const GeoTIFFLoader = {
  dataType: null as unknown as GeoTIFFData,
  batchType: null as never,

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
} as const satisfies LoaderWithParser<GeoTIFFData, never, GeoTIFFLoaderOptions>;

export function isTiff(arrayBuffer: ArrayBuffer): boolean {
  const dataView = new DataView(arrayBuffer);
  // Byte offset
  const endianness = dataView.getUint16(0);
  let littleEndian: boolean;
  switch (endianness) {
    case 0x4949:
      littleEndian = true;
      break;
    case 0x4d4d:
      littleEndian = false;
      break;
    default:
      return false;
    // throw new Error(`invalid byte order: 0x${endianness.toString(16)}`);
  }

  // Magic number
  if (dataView.getUint16(2, littleEndian) !== 42) {
    return false;
  }

  return true;
}

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
  const metadata = image.getGeoKeys();

  // ProjectedCSTypeGeoKey is the only key we support for now, we assume it is an EPSG code
  let crs: string | undefined;
  if (metadata?.ProjectedCSTypeGeoKey) {
    crs = `EPSG:${metadata.ProjectedCSTypeGeoKey}`;
  }

  // Return GeoReferenced image data
  return {
    crs,
    bounds,
    width,
    height,
    data: imageData,
    metadata
  };
}
