// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {OGCAPIFeaturesSource} from './ogc-api-loaders';

/** Shared descriptor for OGCAPIFeaturesLoader. */
export const OGCAPIFeaturesLoaderMetadata = {
  dataType: null as unknown as OGCAPIFeaturesSource,
  batchType: null as never,
  name: 'OGC API Features',
  id: 'ogc-api-features',
  module: 'ogc',
  version: '0.0.0',
  extensions: [] as string[],
  mimeTypes: ['application/geo+json'] as string[],
  type: 'ogc-api-features',
  fromUrl: true,
  fromBlob: false,
  options: {'ogc-api': {}},
  defaultOptions: {'ogc-api': {}},
  testURL: (url: string): boolean => /\/collections(?:\/|$)|ogc[/-]?api[/-]features/i.test(url)
} as const;

/** Loads the OGCAPIFeaturesLoader implementation on first use. */
export const OGCAPIFeaturesLoader = {
  ...OGCAPIFeaturesLoaderMetadata,
  async preload() {
    const implementation = await import('./ogc-api-loaders.js');
    return implementation.OGCAPIFeaturesLoader;
  }
} as const;

import type {OGCAPITilesSource} from './ogc-api-loaders';

/** Shared descriptor for OGCAPITilesLoader. */
export const OGCAPITilesLoaderMetadata = {
  dataType: null as unknown as OGCAPITilesSource,
  batchType: null as never,
  name: 'OGC API Tiles',
  id: 'ogc-api-tiles',
  module: 'ogc',
  version: '0.0.0',
  extensions: [] as string[],
  mimeTypes: [] as string[],
  type: 'ogc-api-tiles',
  fromUrl: true,
  fromBlob: false,
  options: {},
  defaultOptions: {},
  testURL: (url: string): boolean => /\/tiles(?:\/|$)|ogc[/-]?api[/-]tiles/i.test(url)
} as const;

/** Loads the OGCAPITilesLoader implementation on first use. */
export const OGCAPITilesLoader = {
  ...OGCAPITilesLoaderMetadata,
  async preload() {
    const implementation = await import('./ogc-api-loaders.js');
    return implementation.OGCAPITilesLoader;
  }
} as const;
