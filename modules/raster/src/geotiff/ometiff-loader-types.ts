// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {SourceLoader} from '@loaders.gl/core/loader-utils';
import type {OMETiffImageSource, OMETiffLoaderOptions} from './ometiff-loader';
import {OMETiffFormat} from './geotiff-format';
import {GeoTIFFLoader} from './geotiff-loader-types';

/** Metadata-only OMETiff source loader. */
export const OMETiffLoader = {
  dataType: null as unknown as OMETiffImageSource,
  batchType: null as never,
  ...OMETiffFormat,
  name: 'OMETiffLoader',
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
  preload: async () => (await import('@loaders.gl/raster/ometiff-loader')).OMETiffLoader,
  /** Synchronous construction requires the source implementation subpath. */
  createDataSourceSync(_data: string | Blob, _options: OMETiffLoaderOptions): OMETiffImageSource {
    throw new Error(
      'OMETiffLoader requires async createDataSource() or its source implementation subpath'
    );
  }
} as const satisfies SourceLoader<OMETiffImageSource>;
