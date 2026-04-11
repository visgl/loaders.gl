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
  type ImageTextureCubeManifest
} from './lib/composite-image/parse-composite-image';

export type TextureCubeLoaderOptions = TextureApiLoaderOptions;
export type {ImageTextureCubeManifest as TextureCubeManifest};

export const TextureCubeLoader = {
  dataType: null as unknown as Texture,
  batchType: null as never,
  id: 'texture-cube',
  name: 'Texture Cube',
  module: 'textures',
  version: VERSION,
  extensions: [],
  mimeTypes: [],
  text: true,
  worker: false,
  testText: (text: string) => testCompositeImageManifestShape(text, 'image-texture-cube'),
  options: {
    image: {}
  },
  parse: async (
    arrayBuffer: ArrayBuffer,
    options?: TextureCubeLoaderOptions,
    context?: LoaderContext
  ) =>
    await parseCompositeImageManifest(
      new TextDecoder().decode(arrayBuffer),
      'image-texture-cube',
      options,
      context
    ),
  parseText: async (text: string, options?: TextureCubeLoaderOptions, context?: LoaderContext) =>
    await parseCompositeImageManifest(text, 'image-texture-cube', options, context)
} as const satisfies LoaderWithParser<Texture, never, TextureCubeLoaderOptions>;
