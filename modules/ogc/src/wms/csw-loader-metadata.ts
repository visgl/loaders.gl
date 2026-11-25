// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {CSWCatalogSource} from './csw-loader';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Shared descriptor for CSWLoader. */
export const CSWLoaderMetadata = {
  dataType: null as unknown as CSWCatalogSource,
  batchType: null as never,
  name: 'CSW',
  id: 'csw',
  module: 'ogc',
  version: VERSION,
  extensions: [] as string[],
  mimeTypes: [] as string[],
  type: 'csw',
  fromUrl: true,
  fromBlob: false,

  options: {csw: {}},

  defaultOptions: {csw: {}},

  testURL: (url: string): boolean => url.toLowerCase().includes('csw')
} as const;

/** Loads the CSWLoader implementation on first use. */
export const CSWLoader = {
  ...CSWLoaderMetadata,
  async preload() {
    const implementation = await import('./csw-loader.js');
    return implementation.CSWLoader;
  }
} as const;
