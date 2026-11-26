// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader} from '@loaders.gl/core/loader-utils';
import type {Texture} from '@loaders.gl/core/schema';
import type {TextureLoaderOptions as TextureApiLoaderOptions} from './lib/texture-api/texture-api-types';
import {VERSION} from './lib/utils/version';
import {testCompositeImageManifestShape} from './lib/composite-image/test-composite-image-manifest';

export type TextureCubeArrayLoaderOptions = TextureApiLoaderOptions;

/** Preloads the parser-bearing texture cube array manifest loader implementation. */
async function preload() {
  const {TextureCubeArrayLoaderWithParser} = await import('@loaders.gl/images/texture/bundled');
  return TextureCubeArrayLoaderWithParser;
}

export const TextureCubeArrayLoader = {
  dataType: null as unknown as Texture,
  batchType: null as never,
  id: 'texture-cube-array',
  name: 'Texture Cube Array',
  module: 'images',
  version: VERSION,
  extensions: [],
  mimeTypes: [],
  text: true,
  worker: false,
  testText: (text: string) => testCompositeImageManifestShape(text, 'image-texture-cube-array'),
  options: {
    image: {}
  },
  preload
} as const satisfies Loader<Texture, never, TextureCubeArrayLoaderOptions>;
