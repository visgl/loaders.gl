// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {COPCTileSource} from './copc-loader';

// __VERSION__ is injected by the package build.
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';
import {COPCFormat} from './copc-format';

/** Shared descriptor for COPCLoader. */
export const COPCLoaderMetadata = {
  ...COPCFormat,
  dataType: null as unknown as COPCTileSource,
  batchType: null as never,
  name: 'COPC',
  id: 'copc',
  module: 'tiles-3d',
  version: VERSION,
  encoding: 'binary',
  format: 'copc',
  extensions: ['laz'] as string[],
  mimeTypes: ['application/octet-stream'] as string[],
  type: 'copc',
  fromUrl: true,
  fromBlob: true,

  options: {
    copc: {colorFormat: 'uint8norm'}
  },

  defaultOptions: {
    copc: {colorFormat: 'uint8norm'}
  },

  testURL: (url: string) => /\.copc\.laz($|\?)/i.test(url)
} as const;

/** Loads the COPCLoader implementation on first use. */
export const COPCLoader = {
  ...COPCLoaderMetadata,
  async preload() {
    const implementation = await import('./copc-loader.js');
    return implementation.COPCLoader;
  }
} as const;
