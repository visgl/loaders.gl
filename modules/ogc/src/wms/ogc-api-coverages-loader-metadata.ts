// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {OGCAPICoveragesSource} from './ogc-api-coverages-loader';

/** Shared descriptor for OGCAPICoveragesLoader. */
export const OGCAPICoveragesLoaderMetadata = {
  dataType: null as unknown as OGCAPICoveragesSource,
  batchType: null as never,
  name: 'OGC API Coverages',
  id: 'ogc-api-coverages',
  module: 'ogc',
  version: '0.0.0',
  extensions: [] as string[],
  mimeTypes: ['application/json', 'image/tiff', 'application/octet-stream'] as string[],
  type: 'ogc-api-coverages',
  fromUrl: true,
  fromBlob: false,
  options: {'ogc-api-coverages': {}},
  defaultOptions: {'ogc-api-coverages': {}},
  testURL: (url: string): boolean =>
    /(?:\/coverage(?:s)?(?:\/|$)|ogc[/-]?api[/-]?coverages)/i.test(url)
} as const;

/** Loads the OGCAPICoveragesLoader implementation on first use. */
export const OGCAPICoveragesLoader = {
  ...OGCAPICoveragesLoaderMetadata,
  async preload() {
    const implementation = await import('./ogc-api-coverages-loader.js');
    return implementation.OGCAPICoveragesLoader;
  }
} as const;
