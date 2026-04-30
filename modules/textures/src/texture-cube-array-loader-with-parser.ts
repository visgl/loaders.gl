// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderContext, LoaderWithParser} from '@loaders.gl/loader-utils';
import type {Texture} from '@loaders.gl/schema';
import type {TextureLoaderOptions as TextureApiLoaderOptions} from './lib/texture-api/texture-api-types';
import {
  parseCompositeImageManifest,
  type ImageTextureCubeArrayManifest
} from './lib/composite-image/parse-composite-image';
import {TextureCubeArrayLoader as TextureCubeArrayLoaderMetadata} from './texture-cube-array-loader';

const {preload: _TextureCubeArrayLoaderPreload, ...TextureCubeArrayLoaderMetadataWithoutPreload} =
  TextureCubeArrayLoaderMetadata;

export type TextureCubeArrayLoaderOptions = TextureApiLoaderOptions;
export type {ImageTextureCubeArrayManifest as TextureCubeArrayManifest};

export const TextureCubeArrayLoaderWithParser = {
  ...TextureCubeArrayLoaderMetadataWithoutPreload,
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
