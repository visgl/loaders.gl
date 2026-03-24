// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  loadCompositeImageUrlTree,
  normalizeCompositeImageOptions
} from '../composite-image/parse-composite-image';
import {
  IMAGE_TEXTURE_CUBE_FACES,
  type ImageCubeTexture
} from '../composite-image/image-texture-cube';
import type {GetUrl, TextureLoaderOptions} from './texture-api-types';
import {getImageUrls} from './load-image';

// Returns an object with six key-value pairs containing the urls (or url mip arrays)
// for each cube face
export async function getImageCubeUrls(getUrl: GetUrl, options: TextureLoaderOptions) {
  // Calculate URLs
  const urls: Record<number, string | string[]> = {};
  const promises: Promise<any>[] = [];

  let index = 0;
  for (let i = 0; i < IMAGE_TEXTURE_CUBE_FACES.length; ++i) {
    const face = IMAGE_TEXTURE_CUBE_FACES[index];
    const promise = getImageUrls(getUrl, options, {...face, index: index++}).then((url) => {
      urls[face.face] = url;
    });
    promises.push(promise);
  }

  await Promise.all(promises);

  return urls;
}

// Returns an object with six key-value pairs containing the images (or image mip arrays)
// for each cube face
/**
 * @deprecated Use `load(url, TextureCubeLoader)` for manifest-driven loading.
 */
export async function loadImageTextureCube(
  getUrl: GetUrl,
  options: TextureLoaderOptions = {}
): Promise<ImageCubeTexture> {
  const urls = await getImageCubeUrls(getUrl, options);
  return (await loadCompositeImageUrlTree(
    urls,
    normalizeCompositeImageOptions(options)
  )) as ImageCubeTexture;
}
