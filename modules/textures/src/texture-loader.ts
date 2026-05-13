// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader} from '@loaders.gl/loader-utils';
import type {Texture} from '@loaders.gl/schema';
import type {TextureLoaderOptions as TextureApiLoaderOptions} from './lib/texture-api/texture-api-types';
import {VERSION} from './lib/utils/version';
import {
  testCompositeImageManifestShape,
  type ImageTextureManifest
} from './lib/composite-image/parse-composite-image';

export type TextureManifestLoaderOptions = TextureApiLoaderOptions;
export type {ImageTextureManifest as TextureManifest};

/** Preloads the parser-bearing texture manifest loader implementation. */
async function preload() {
  const {TextureLoaderWithParser} = await import('./texture-loader-with-parser');
  return TextureLoaderWithParser;
}

export const TextureLoader = {
  dataType: null as unknown as Texture,
  batchType: null as never,
  id: 'texture',
  name: 'Texture',
  module: 'textures',
  version: VERSION,
  extensions: [],
  mimeTypes: [],
  text: true,
  worker: false,
  testText: (text: string) => testCompositeImageManifestShape(text, 'image-texture'),
  options: {
    image: {}
  },
  preload
} as const satisfies Loader<Texture, never, TextureManifestLoaderOptions>;
