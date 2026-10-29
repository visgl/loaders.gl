// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader} from '@loaders.gl/core/loader-utils';
import type {Texture} from '@loaders.gl/core/schema';
import type {TextureLoaderOptions as TextureApiLoaderOptions} from './lib/texture-api/texture-api-types';
import {VERSION} from './lib/utils/version';
import {testCompositeImageManifestShape} from './lib/composite-image/test-composite-image-manifest';
import type {ImageTextureCubeManifest} from './lib/composite-image/parse-composite-image';

export type TextureCubeLoaderOptions = TextureApiLoaderOptions;
export type {ImageTextureCubeManifest as TextureCubeManifest};

/** Preloads the parser-bearing texture cube manifest loader implementation. */
async function preload() {
  const {TextureCubeLoaderWithParser} = await import('@loaders.gl/images/texture-cube-loader');
  return TextureCubeLoaderWithParser;
}

export const TextureCubeLoader = {
  dataType: null as unknown as Texture,
  batchType: null as never,
  id: 'texture-cube',
  name: 'Texture Cube',
  module: 'images',
  version: VERSION,
  extensions: [],
  mimeTypes: [],
  text: true,
  worker: false,
  testText: (text: string) => testCompositeImageManifestShape(text, 'image-texture-cube'),
  options: {
    image: {}
  },
  preload
} as const satisfies Loader<Texture, never, TextureCubeLoaderOptions>;
