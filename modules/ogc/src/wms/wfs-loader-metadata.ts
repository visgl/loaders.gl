// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WFSVectorSource} from './wfs-loader';

/** Shared descriptor for WFSLoader. */
export const WFSLoaderMetadata = {
  dataType: null as unknown as WFSVectorSource,
  batchType: null as never,
  name: 'WFS',
  id: 'wfs',
  module: 'ogc',
  version: '0.0.0',
  extensions: [] as string[],
  mimeTypes: [] as string[],
  type: 'wfs',
  fromUrl: true,
  fromBlob: false,

  options: {
    wfs: {}
  },

  defaultOptions: {
    wfs: {}
  },

  testURL: (url: string): boolean => url.toLowerCase().includes('wfs')
} as const;

/** Loads the WFSLoader implementation on first use. */
export const WFSLoader = {
  ...WFSLoaderMetadata,
  async preload() {
    const implementation = await import('./wfs-loader.js');
    return implementation.WFSLoader;
  }
} as const;
