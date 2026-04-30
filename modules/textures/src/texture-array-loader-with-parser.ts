// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderContext, LoaderWithParser} from '@loaders.gl/loader-utils';
import type {Texture} from '@loaders.gl/schema';
import type {TextureLoaderOptions as TextureApiLoaderOptions} from './lib/texture-api/texture-api-types';
import {
  parseCompositeImageManifest,
  type ImageTextureArrayManifest
} from './lib/composite-image/parse-composite-image';
import {TextureArrayLoader as TextureArrayLoaderMetadata} from './texture-array-loader';

const {preload: _TextureArrayLoaderPreload, ...TextureArrayLoaderMetadataWithoutPreload} =
  TextureArrayLoaderMetadata;

export type TextureArrayLoaderOptions = TextureApiLoaderOptions;
export type {ImageTextureArrayManifest as TextureArrayManifest};

export const TextureArrayLoaderWithParser = {
  ...TextureArrayLoaderMetadataWithoutPreload,
  parse: async (
    arrayBuffer: ArrayBuffer,
    options?: TextureArrayLoaderOptions,
    context?: LoaderContext
  ) =>
    await parseCompositeImageManifest(
      new TextDecoder().decode(arrayBuffer),
      'image-texture-array',
      options,
      context
    ),
  parseText: async (text: string, options?: TextureArrayLoaderOptions, context?: LoaderContext) =>
    await parseCompositeImageManifest(text, 'image-texture-array', options, context)
} as const satisfies LoaderWithParser<Texture, never, TextureArrayLoaderOptions>;
