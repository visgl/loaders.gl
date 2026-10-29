// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GetUrl, UrlOptions} from './texture-api-types';

// Generate a member url by calling getUrl with merged options.
export function generateUrl(
  getUrl: string | GetUrl,
  options: UrlOptions,
  urlOptions: Record<string, any>
): string {
  return typeof getUrl === 'function' ? getUrl({...options, ...urlOptions}) : getUrl;
}
