// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader} from '@loaders.gl/loader-utils';
import type {Texture} from '@loaders.gl/schema';
import type {TextureLoaderOptions as TextureApiLoaderOptions} from './lib/texture-api/texture-api-types';
import {VERSION} from './lib/utils/version';
import {
  testCompositeImageManifestShape,
  type ImageTextureArrayManifest
} from './lib/composite-image/parse-composite-image';

export type TextureArrayLoaderOptions = TextureApiLoaderOptions;
export type {ImageTextureArrayManifest as TextureArrayManifest};

/** Preloads the parser-bearing texture array manifest loader implementation. */
async function preload() {
  const {TextureArrayLoaderWithParser} = await import('./texture-array-loader-with-parser');
  return TextureArrayLoaderWithParser;
}

export const TextureArrayLoader = {
  dataType: null as unknown as Texture,
  batchType: null as never,
  id: 'texture-array',
  name: 'Texture Array',
  module: 'textures',
  version: VERSION,
  extensions: [],
  mimeTypes: [],
  text: true,
  worker: false,
  testText: (text: string) => testCompositeImageManifestShape(text, 'image-texture-array'),
  options: {
    image: {}
  },
  preload
} as const satisfies Loader<Texture, never, TextureArrayLoaderOptions>;
