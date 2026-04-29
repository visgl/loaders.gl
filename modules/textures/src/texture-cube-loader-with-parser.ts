// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderContext, LoaderWithParser} from '@loaders.gl/loader-utils';
import type {Texture} from '@loaders.gl/schema';
import type {TextureLoaderOptions as TextureApiLoaderOptions} from './lib/texture-api/texture-api-types';
import {
  parseCompositeImageManifest,
  type ImageTextureCubeManifest
} from './lib/composite-image/parse-composite-image';
import {TextureCubeLoader as TextureCubeLoaderMetadata} from './texture-cube-loader';

const {preload: _TextureCubeLoaderPreload, ...TextureCubeLoaderMetadataWithoutPreload} =
  TextureCubeLoaderMetadata;

export type TextureCubeLoaderOptions = TextureApiLoaderOptions;
export type {ImageTextureCubeManifest as TextureCubeManifest};

export const TextureCubeLoaderWithParser = {
  ...TextureCubeLoaderMetadataWithoutPreload,
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
