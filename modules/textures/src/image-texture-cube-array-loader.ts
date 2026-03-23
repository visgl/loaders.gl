// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderContext, LoaderWithParser} from '@loaders.gl/loader-utils'
import type {TextureLoaderOptions} from './lib/texture-api/texture-api-types'
import {VERSION} from './lib/utils/version'
import type {ImageCubeTexture} from './lib/composite-image/image-texture-cube'
import {
  parseCompositeImageManifest,
  testCompositeImageManifestShape,
  type ImageTextureCubeArrayManifest
} from './lib/composite-image/parse-composite-image'

export type ImageTextureCubeArrayLoaderOptions = TextureLoaderOptions
export type {ImageTextureCubeArrayManifest}

export const ImageTextureCubeArrayLoader = {
  dataType: null as unknown as ImageCubeTexture[],
  batchType: null as never,
  id: 'image-texture-cube-array',
  name: 'Image Texture Cube Array',
  module: 'textures',
  version: VERSION,
  extensions: ['json'],
  mimeTypes: ['application/json'],
  text: true,
  worker: false,
  testText: (text: string) => testCompositeImageManifestShape(text, 'image-texture-cube-array'),
  options: {
    image: {}
  },
  parse: async (
    arrayBuffer: ArrayBuffer,
    options?: ImageTextureCubeArrayLoaderOptions,
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
    options?: ImageTextureCubeArrayLoaderOptions,
    context?: LoaderContext
  ) =>
    await parseCompositeImageManifest(text, 'image-texture-cube-array', options, context)
} as const satisfies LoaderWithParser<
  ImageCubeTexture[],
  never,
  ImageTextureCubeArrayLoaderOptions
>
