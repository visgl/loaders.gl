// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderContext, LoaderWithParser} from '@loaders.gl/loader-utils'
import type {ImageType} from '@loaders.gl/images'
import type {TextureLoaderOptions} from './lib/texture-api/texture-api-types'
import {VERSION} from './lib/utils/version'
import {
  parseCompositeImageManifest,
  testCompositeImageManifestShape,
  type ImageTextureArrayManifest
} from './lib/composite-image/parse-composite-image'

export type ImageTextureArrayLoaderOptions = TextureLoaderOptions
export type {ImageTextureArrayManifest}

export const ImageTextureArrayLoader = {
  dataType: null as unknown as Array<ImageType | ImageType[]>,
  batchType: null as never,
  id: 'image-texture-array',
  name: 'Image Texture Array',
  module: 'textures',
  version: VERSION,
  extensions: ['json'],
  mimeTypes: ['application/json'],
  text: true,
  worker: false,
  testText: (text: string) => testCompositeImageManifestShape(text, 'image-texture-array'),
  options: {
    image: {}
  },
  parse: async (
    arrayBuffer: ArrayBuffer,
    options?: ImageTextureArrayLoaderOptions,
    context?: LoaderContext
  ) =>
    await parseCompositeImageManifest(
      new TextDecoder().decode(arrayBuffer),
      'image-texture-array',
      options,
      context
    ),
  parseText: async (
    text: string,
    options?: ImageTextureArrayLoaderOptions,
    context?: LoaderContext
  ) =>
    await parseCompositeImageManifest(text, 'image-texture-array', options, context)
} as const satisfies LoaderWithParser<
  Array<ImageType | ImageType[]>,
  never,
  ImageTextureArrayLoaderOptions
>
