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
  type ImageTextureCubeArrayManifest
} from './lib/composite-image/parse-composite-image';

export type TextureCubeArrayLoaderOptions = TextureApiLoaderOptions;
export type {ImageTextureCubeArrayManifest as TextureCubeArrayManifest};

export const TextureCubeArrayLoader = {
  dataType: null as unknown as Texture,
  batchType: null as never,
  id: 'texture-cube-array',
  name: 'Texture Cube Array',
  module: 'textures',
  version: VERSION,
  extensions: [],
  mimeTypes: [],
  text: true,
  worker: false,
  testText: (text: string) => testCompositeImageManifestShape(text, 'image-texture-cube-array'),
  options: {
    image: {}
  },
  parse: async (
    arrayBuffer: ArrayBuffer,
    options?: TextureCubeArrayLoaderOptions,
    context?: LoaderContext
  ) =>
    await parseCompositeImageManifest(
      new TextDecoder().decode(arrayBuffer),
      'image-texture-cube-array',
      options,
      context
    ),
  parseText: async (
    text: string,
    options?: TextureCubeArrayLoaderOptions,
    context?: LoaderContext
  ) => await parseCompositeImageManifest(text, 'image-texture-cube-array', options, context)
} as const satisfies LoaderWithParser<Texture, never, TextureCubeArrayLoaderOptions>;
