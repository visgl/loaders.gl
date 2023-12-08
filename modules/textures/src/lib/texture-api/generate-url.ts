// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {resolvePath} from '@loaders.gl/loader-utils';
import type {GetUrl, UrlOptions} from './texture-api-types';

// Generate a url by calling getUrl with mix of options, applying options.baseUrl
export function generateUrl(
  getUrl: string | GetUrl,
  options: UrlOptions,
  urlOptions: Record<string, any>
): string {
  // Get url
  let url = typeof getUrl === 'function' ? getUrl({...options, ...urlOptions}) : getUrl;

  // Apply options.baseUrl
  const baseUrl = options.baseUrl;
  if (baseUrl) {
    url = baseUrl[baseUrl.length - 1] === '/' ? `${baseUrl}${url}` : `${baseUrl}/${url}`;
  }

  return resolvePath(url);
}
