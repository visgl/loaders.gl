// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WMSImageSource} from './wms-loader';

/** Shared descriptor for WMSLoader. */
export const WMSLoaderMetadata = {
  dataType: null as unknown as WMSImageSource,
  batchType: null as never,
  name: 'Web Map Service (OGC WMS)',
  id: 'wms',
  module: 'ogc',
  version: '0.0.0',
  extensions: [] as string[],
  mimeTypes: [] as string[],
  type: 'wms',
  fromUrl: true,
  fromBlob: false,

  options: {
    wms: {
      // TODO - add options here
    }
  },

  defaultOptions: {
    wms: {
      // TODO - add options here
    }
  },

  testURL: (url: string): boolean => url.toLowerCase().includes('wms')
} as const;

/** Loads the WMSLoader implementation on first use. */
export const WMSLoader = {
  ...WMSLoaderMetadata,
  async preload() {
    const implementation = await import('./wms-loader.js');
    return implementation.WMSLoader;
  }
} as const;
