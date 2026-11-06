// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// loaders.gl

import type {Loader} from '@loaders.gl/core/loader-utils';
import type {USDLoaderOptions, USDStage} from './lib/usd-types';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Loads the parser-bearing USD loader implementation. */
async function preload() {
  const {USDLoaderWithParser} = await import('@loaders.gl/scene/usd-loader');
  return USDLoaderWithParser;
}

/** Metadata-only loader for OpenUSD ASCII, supported binary crate layers, and stored USDZ scenes. */
export const USDLoader = {
  dataType: null as unknown as USDStage,
  batchType: null as never,
  name: 'Universal Scene Description',
  id: 'usd',
  module: 'scene',
  version: VERSION,
  extensions: ['usd', 'usda', 'usdc', 'usdz'],
  mimeTypes: ['model/vnd.usd', 'model/vnd.usda', 'model/vnd.usdc', 'model/vnd.usdz+zip'],
  text: true,
  binary: true,
  tests: ['#usda', 'PXR-USDC', 'PK'],
  options: {
    usd: {
      compose: true,
      loadReferences: true,
      maxReferenceDepth: 12,
      variantSelections: {}
    }
  },
  preload
} as const satisfies Loader<USDStage, never, USDLoaderOptions>;
