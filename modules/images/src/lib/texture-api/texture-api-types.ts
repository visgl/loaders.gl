// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderOptions} from '@loaders.gl/core/loader-utils';
import type {ImageLoaderOptions} from '@loaders.gl/images';

export type {ImageType} from '@loaders.gl/images';

/** Shared options for image texture manifests. */
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
