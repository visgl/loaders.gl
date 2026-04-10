// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderOptions} from '@loaders.gl/loader-utils';
import type {ImageLoaderOptions} from '@loaders.gl/images';

export type {ImageType} from '@loaders.gl/images';

export type UrlOptions = {
  baseUrl?: string;
  index?: number;
  face?: number;
  lod?: number;
  direction?: string;
};
export type GetUrl = (options: UrlOptions) => string;

export type TextureLoaderOptions = LoaderOptions & {
  core?: NonNullable<LoaderOptions['core']> & {
    /** Base URL for resolving composite image members when no loader context URL is available */
    baseUrl?: string;
  };
  /** @deprecated Legacy helper alias kept for loadImageTexture* compatibility */
  baseUrl?: string;
  image?: NonNullable<ImageLoaderOptions['image']> & {
    mipLevels?: number | 'auto';
  };
};
