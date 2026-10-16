// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {SourceLoader} from '@loaders.gl/loader-utils';
import type {OMETiffImageSource, OMETiffSourceLoaderOptions} from './ometiff-source-loader';
import {OMETiffFormat} from './geotiff-format';
import {GeoTIFFLoader} from './geotiff-loader-types';

/** Metadata-only OMETiff source loader. */
export const OMETiffSourceLoader = {
  dataType: null as unknown as OMETiffImageSource,
  batchType: null as never,
  ...OMETiffFormat,
  name: 'OMETiffSourceLoader',
  version: GeoTIFFLoader.version,
  type: 'ometiff',
  fromUrl: true,
  fromBlob: true,

  options: {
    ometiff: {
      headers: undefined!,
      interleaved: false,
      defaultChannels: undefined!
    }
  },

  defaultOptions: {
    ometiff: {
      headers: undefined!,
      interleaved: false,
      defaultChannels: undefined!
    }
  },

  testURL: (url: string): boolean => /\.ome\.tiff?(?:$|[?#])/i.test(url),
  /** Loads the implementation for asynchronous source construction. */
  preload: async () =>
    (await import('@loaders.gl/raster/geotiff/ometiff-source-loader')).OMETiffSourceLoader,
  /** Synchronous construction requires the source implementation subpath. */
  createDataSource(_data: string | Blob, _options: OMETiffSourceLoaderOptions): OMETiffImageSource {
    throw new Error(
      'OMETiffSourceLoader requires async load() or its source implementation subpath'
    );
  }
} as const satisfies SourceLoader<OMETiffImageSource>;
