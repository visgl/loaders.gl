// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WCSCoverageSource} from './wcs-coverage-loader';

/** Shared descriptor for WCSCoverageLoader. */
export const WCSCoverageLoaderMetadata = {
  dataType: null as unknown as WCSCoverageSource,
  batchType: null as never,
  name: 'WCS Coverage',
  id: 'wcs-coverage',
  module: 'ogc',
  version: '0.0.0',
  extensions: [] as string[],
  mimeTypes: ['application/xml', 'image/tiff', 'image/lerc'] as string[],
  type: 'wcs-coverage',
  fromUrl: true,
  fromBlob: false,
  options: {wcs: {}},
  defaultOptions: {wcs: {}},
  testURL: (url: string): boolean => url.toLowerCase().includes('wcs')
} as const;

/** Loads the WCSCoverageLoader implementation on first use. */
export const WCSCoverageLoader = {
  ...WCSCoverageLoaderMetadata,
  async preload() {
    const implementation = await import('./wcs-coverage-loader.js');
    return implementation.WCSCoverageLoader;
  }
} as const;
