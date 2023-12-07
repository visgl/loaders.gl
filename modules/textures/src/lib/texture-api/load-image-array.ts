// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ImageLoader} from '@loaders.gl/images';
import type {GetUrl} from './texture-api-types';
import {getImageUrls} from './load-image';
import {deepLoad} from './deep-load';

export async function loadImageTextureArray(
  count: number,
  getUrl: GetUrl,
  options = {}
): Promise<any> {
  const imageUrls = await getImageArrayUrls(count, getUrl, options);
  return await deepLoad(imageUrls, ImageLoader.parse, options);
}

export async function getImageArrayUrls(count: number, getUrl: GetUrl, options = {}): Promise<any> {
  const promises: Promise<any>[] = [];
  for (let index = 0; index < count; index++) {
    const promise = getImageUrls(getUrl, options, {index});
    promises.push(promise);
  }
  return await Promise.all(promises);
}
