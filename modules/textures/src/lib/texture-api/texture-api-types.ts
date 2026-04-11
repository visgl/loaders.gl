// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderOptions} from '@loaders.gl/loader-utils';
import type {ImageBitmapLoaderOptions} from '@loaders.gl/images';

export type {ImageType} from '@loaders.gl/images';

/** URL template variables for legacy texture helper APIs. */
export type UrlOptions = {
  baseUrl?: string;
  index?: number;
  face?: number;
  lod?: number;
  direction?: string;
};
/** Callback that resolves a member URL from texture helper options. */
export type GetUrl = (options: UrlOptions) => string;

/** Shared options for legacy image-based texture helper APIs. */
export type TextureLoaderOptions = LoaderOptions & {
  core?: NonNullable<LoaderOptions['core']> & {
    /** Base URL for resolving composite image members when no loader context URL is available */
    baseUrl?: string;
  };
  /** @deprecated Legacy helper alias kept for loadImageTexture* compatibility */
  baseUrl?: string;
  image?: NonNullable<ImageBitmapLoaderOptions['image']> & {
    mipLevels?: number | 'auto';
  };
};
