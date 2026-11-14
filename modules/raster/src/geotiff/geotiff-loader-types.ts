// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TypedArray, Loader, LoaderOptions} from '@loaders.gl/core/loader-utils';
import type {CRSIdentifier} from '@math.gl/geospatial/crs';
import type {GeoTIFFSourceLoaderOptions} from './geotiff-source-loader';
import {GeoTIFFFormat} from './geotiff-format';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

// Return type definition for GeoTIFF loader
type GeoTIFFData = {
  crs?: CRSIdentifier;
  bounds: number[];
  metadata: Record<string, unknown>;

  width: number;
  height: number;
  data: TypedArray;
};

/** GeoTIFF load options */
export type GeoTIFFLoaderOptions = LoaderOptions & {
  geotiff?: GeoTIFFSourceLoaderOptions['geotiff'] & {enableAlpha?: boolean};
};

/** Preloads the parser-bearing GeoTIFF loader implementation. */
async function preload() {
  const {GeoTIFFLoaderWithParser} = await import('@loaders.gl/raster/geotiff-loader');
  return GeoTIFFLoaderWithParser;
}

/** Metadata-only GeoTIFF loader. */
export const GeoTIFFLoader = {
  /** Matches input for source selection. */
  testURL: (url: string): boolean => {
    if (/\.ome\.tiff?(?:$|[?#])/i.test(url)) {
      return false;
    }
    return /\.(?:geotiff?|tiff?)(?:$|[?#])/i.test(url);
  },
  fromUrl: true,
  fromBlob: true,
  type: 'geotiff',
  dataType: null as unknown as GeoTIFFData,
  batchType: null as never,

  ...GeoTIFFFormat,
  version: VERSION,
  options: {
    geotiff: {
      enableAlpha: true
    }
  },
  preload
} as const satisfies Loader<GeoTIFFData, never, GeoTIFFLoaderOptions>;
