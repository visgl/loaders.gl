// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  loadCompositeImageUrlTree,
  normalizeCompositeImageOptions
} from '../composite-image/parse-composite-image';
import type {GetUrl, TextureLoaderOptions} from './texture-api-types';
import {getImageUrls} from './load-image';

/**
 * @deprecated Use `load(url, TextureArrayLoader)` for manifest-driven loading.
 */
export async function loadImageTextureArray(
  count: number,
  getUrl: GetUrl,
  options: TextureLoaderOptions = {}
): Promise<any> {
  const imageUrls = await getImageArrayUrls(count, getUrl, options);
  return await loadCompositeImageUrlTree(imageUrls, normalizeCompositeImageOptions(options));
}

export async function getImageArrayUrls(
  count: number,
  getUrl: GetUrl,
  options: TextureLoaderOptions = {}
): Promise<any> {
  const promises: Promise<any>[] = [];
  for (let index = 0; index < count; index++) {
    const promise = getImageUrls(getUrl, options, {index});
    promises.push(promise);
  }
  return await Promise.all(promises);
}
