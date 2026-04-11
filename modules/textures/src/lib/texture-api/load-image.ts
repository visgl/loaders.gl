// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {assert} from '@loaders.gl/loader-utils';
import {getImageSize} from '@loaders.gl/images';
import {
  loadCompositeImageMember,
  loadCompositeImageUrlTree,
  normalizeCompositeImageOptions
} from '../composite-image/parse-composite-image';
import type {GetUrl, TextureLoaderOptions, UrlOptions} from './texture-api-types';
import {generateUrl} from './generate-url';

/**
 * @deprecated Use `load(url, TextureLoader)` for manifest-driven loading.
 */
export async function loadImageTexture(
  getUrl: string | GetUrl,
  options: TextureLoaderOptions = {}
): Promise<any> {
  const imageUrls = await getImageUrls(getUrl, options);
  return await loadCompositeImageUrlTree(imageUrls, normalizeCompositeImageOptions(options));
}

export async function getImageUrls(
  getUrl: string | GetUrl,
  options: TextureLoaderOptions,
  urlOptions: UrlOptions = {}
): Promise<any> {
  const mipLevels = (options && options.image && options.image.mipLevels) || 0;
  return mipLevels !== 0
    ? await getMipmappedImageUrls(getUrl, mipLevels, options, urlOptions)
    : generateUrl(getUrl, options, urlOptions);
}

async function getMipmappedImageUrls(
  getUrl: string | GetUrl,
  mipLevels: number | 'auto',
  options: TextureLoaderOptions,
  urlOptions: UrlOptions
): Promise<string[]> {
  const urls: string[] = [];
  const normalizedOptions = normalizeCompositeImageOptions(options);

  // If no mip levels supplied, we need to load the level 0 image and calculate based on size
  if (mipLevels === 'auto') {
    const url = generateUrl(getUrl, options, {...urlOptions, lod: 0});
    const image = await loadCompositeImageMember(url, normalizedOptions);

    const {width, height} = getImageSize(image);
    mipLevels = getMipLevels({width, height});

    // TODO - push image and make `deepLoad` pass through non-url values, avoid loading twice?
    urls.push(url);
  }

  // We now know how many mipLevels we need, remaining image urls can now be constructed
  assert(mipLevels > 0);

  for (let mipLevel = urls.length; mipLevel < mipLevels; ++mipLevel) {
    const url = generateUrl(getUrl, options, {...urlOptions, lod: mipLevel});
    urls.push(url);
  }

  return urls;
}

// Calculates number of mipmaps based on texture size (log2)
export function getMipLevels(size: {width: number; height: number}): number {
  return 1 + Math.floor(Math.log2(Math.max(size.width, size.height)));
}
