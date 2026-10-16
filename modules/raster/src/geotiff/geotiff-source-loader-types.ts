// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {SourceLoader} from '@loaders.gl/loader-utils';
import type {GeoTIFFRasterSource, GeoTIFFSourceLoaderOptions} from './geotiff-source-loader';
import {GeoTIFFFormat} from './geotiff-format';
import {GeoTIFFLoader} from './geotiff-loader-types';

/** Metadata-only GeoTIFF source loader. */
export const GeoTIFFSourceLoader = {
  dataType: null as unknown as GeoTIFFRasterSource,
  batchType: null as never,
  ...GeoTIFFFormat,
  name: 'GeoTIFFSourceLoader',
  version: GeoTIFFLoader.version,
  type: 'geotiff',
  fromUrl: true,
  fromBlob: true,

  options: {
    geotiff: {
      headers: undefined!,
      interleaved: false,
      resampleMethod: 'nearest'
    }
  },

  defaultOptions: {
    geotiff: {
      headers: undefined!,
      interleaved: false,
      resampleMethod: 'nearest'
    }
  },

  testURL: (url: string): boolean => {
    if (/\.ome\.tiff?(?:$|[?#])/i.test(url)) {
      return false;
    }
    return /\.(?:geotiff?|tiff?)(?:$|[?#])/i.test(url);
  },
  /** Loads the implementation for asynchronous source construction. */
  preload: async () =>
    (await import('@loaders.gl/raster/geotiff/geotiff-source-loader')).GeoTIFFSourceLoader,
  /** Synchronous construction requires the source implementation subpath. */
  createDataSource(
    _data: string | Blob,
    _options: GeoTIFFSourceLoaderOptions
  ): GeoTIFFRasterSource {
    throw new Error(
      'GeoTIFFSourceLoader requires async load() or its source implementation subpath'
    );
  }
} as const satisfies SourceLoader<GeoTIFFRasterSource>;
