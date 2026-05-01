// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderContext, LoaderWithParser} from '@loaders.gl/loader-utils';
import type {Texture} from '@loaders.gl/schema';
import type {TextureLoaderOptions as TextureApiLoaderOptions} from './lib/texture-api/texture-api-types';
import {
  parseCompositeImageManifest,
  type ImageTextureManifest
} from './lib/composite-image/parse-composite-image';
import {TextureLoader as TextureLoaderMetadata} from './texture-loader';

const {preload: _TextureLoaderPreload, ...TextureLoaderMetadataWithoutPreload} =
  TextureLoaderMetadata;

export type TextureManifestLoaderOptions = TextureApiLoaderOptions;
export type {ImageTextureManifest as TextureManifest};

export const TextureLoaderWithParser = {
  ...TextureLoaderMetadataWithoutPreload,
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
