// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderContext, StrictLoaderOptions} from '@loaders.gl/loader-utils';

// Resolves a relative url against a baseUrl
// If url is absolute, return it unchanged
export function resolveUrl(url: string, options?: StrictLoaderOptions, context?: LoaderContext) {
  // TODO: Use better logic to handle all protocols plus not delay on data
  const absolute = url.startsWith('data:') || url.startsWith('http:') || url.startsWith('https:');
  if (absolute) {
    return canonicalizeUrl(url);
  }
  const baseUrl = context?.baseUrl || getResolveBaseUrl(options?.core?.baseUrl);
  if (!baseUrl) {
    throw new Error(`'baseUrl' must be provided to resolve relative url ${url}`);
  }
  const resolvedUrl = baseUrl.endsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`;
  return canonicalizeUrl(resolvedUrl);
}

/**
 * Normalize equivalent absolute URLs for cache and cycle-detection keys.
 * Non-URL paths are returned unchanged so local and virtual file-system resolution remains intact.
 * @param url - URL to normalize.
 * @returns Canonical URL when the input has a supported absolute scheme.
 */
export function canonicalizeUrl(url: string): string {
  try {
    return new URL(url).href;
  } catch {
    return url;
  }
}

function getResolveBaseUrl(baseUrl?: string): string | undefined {
  if (!baseUrl) {
    return undefined;
  }

  if (baseUrl.endsWith('/')) {
    return baseUrl;
  }

  const slashIndex = baseUrl.lastIndexOf('/');
  return slashIndex >= 0 ? baseUrl.slice(0, slashIndex + 1) : '';
}
