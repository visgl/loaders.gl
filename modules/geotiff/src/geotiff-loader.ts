// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TypedArray, Loader, LoaderOptions} from '@loaders.gl/loader-utils';

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

/** Preloads the parser-bearing GeoTIFF loader implementation. */
async function preload() {
  const {GeoTIFFLoaderWithParser} = await import('./geotiff-loader-with-parser');
  return GeoTIFFLoaderWithParser;
}

/** Metadata-only GeoTIFF loader. */
export const GeoTIFFLoader = {
  dataType: null as unknown as GeoTIFFData,
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
  preload
} as const satisfies Loader<GeoTIFFData, never, GeoTIFFLoaderOptions>;

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
