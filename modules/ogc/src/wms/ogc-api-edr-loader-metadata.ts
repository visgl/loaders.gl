// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {OGCAPIEDRSource} from './ogc-api-edr-loader';

/** Shared descriptor for OGCAPIEDRLoader. */
export const OGCAPIEDRLoaderMetadata = {
  dataType: null as unknown as OGCAPIEDRSource,
  batchType: null as never,
  name: 'OGC API EDR',
  id: 'ogc-api-edr',
  module: 'ogc',
  version: '0.0.0',
  extensions: [] as string[],
  mimeTypes: ['application/json', 'application/geo+json'] as string[],
  type: 'ogc-api-edr',
  fromUrl: true,
  fromBlob: false,
  options: {'ogc-api-edr': {}},
  defaultOptions: {'ogc-api-edr': {}},
  testURL: (url: string): boolean =>
    /(?:\/edr(?:\/|$)|ogc[/-]?api[/-]?edr|\/collections\/[^/]+\/(?:position|radius|area|cube|trajectory|corridor|locations)(?:\/|$))/i.test(
      url
    )
} as const;

/** Loads the OGCAPIEDRLoader implementation on first use. */
export const OGCAPIEDRLoader = {
  ...OGCAPIEDRLoaderMetadata,
  async preload() {
    const implementation = await import('./ogc-api-edr-loader.js');
    return implementation.OGCAPIEDRLoader;
  }
} as const;
