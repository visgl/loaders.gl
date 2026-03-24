// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderContext, LoaderWithParser} from '@loaders.gl/loader-utils';
import type {Texture} from '@loaders.gl/schema';
import type {TextureLoaderOptions as TextureApiLoaderOptions} from './lib/texture-api/texture-api-types';
import {VERSION} from './lib/utils/version';
import {
  parseCompositeImageManifest,
  testCompositeImageManifestShape,
  type ImageTextureManifest
} from './lib/composite-image/parse-composite-image';

export type TextureManifestLoaderOptions = TextureApiLoaderOptions;
export type {ImageTextureManifest as TextureManifest};

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
  parse: async (
    arrayBuffer: ArrayBuffer,
    options?: TextureManifestLoaderOptions,
    context?: LoaderContext
  ) =>
    await parseCompositeImageManifest(
      new TextDecoder().decode(arrayBuffer),
      'image-texture',
      options,
      context
    ),
  parseText: async (
    text: string,
    options?: TextureManifestLoaderOptions,
    context?: LoaderContext
  ) => await parseCompositeImageManifest(text, 'image-texture', options, context)
} as const satisfies LoaderWithParser<Texture, never, TextureManifestLoaderOptions>;
