// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WMTSImageTileSource} from './wmts-loader';

/** Shared descriptor for WMTSLoader. */
export const WMTSLoaderMetadata = {
  dataType: null as unknown as WMTSImageTileSource,
  batchType: null as never,
  name: 'Web Map Tile Service (OGC WMTS)',
  id: 'wmts',
  module: 'ogc',
  version: '0.0.0',
  extensions: [] as string[],
  mimeTypes: [] as string[],
  type: 'wmts',
  fromUrl: true,
  fromBlob: false,
  options: {wmts: {}},
  defaultOptions: {wmts: {}},
  testURL: (url: string): boolean => /wmts|GetTile/i.test(url)
} as const;

/** Loads the WMTSLoader implementation on first use. */
export const WMTSLoader = {
  ...WMTSLoaderMetadata,
  async preload() {
    const implementation = await import('./wmts-loader.js');
    return implementation.WMTSLoader;
  }
} as const;
