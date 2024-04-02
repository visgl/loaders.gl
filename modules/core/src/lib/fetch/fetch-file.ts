// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {resolvePath} from '@loaders.gl/loader-utils';
import {makeResponse} from '../utils/response-utils';
// import {FetchError} from './fetch-error';

export function isNodePath(url: string): boolean {
  return !isRequestURL(url) && !isDataURL(url);
}

export function isRequestURL(url: string): boolean {
  return url.startsWith('http:') || url.startsWith('https:');
}

export function isDataURL(url: string): boolean {
  return url.startsWith('data:');
}

/**
 * fetch API compatible function
 * - Supports fetching from Node.js local file system paths
 * - Respects pathPrefix and file aliases
 */
export async function fetchFile(
  urlOrData: string | Blob,
  fetchOptions?: RequestInit
): Promise<Response> {
  if (typeof urlOrData === 'string') {
    const url = resolvePath(urlOrData);

    // Support fetching from local file system
    if (isNodePath(url)) {
      if (globalThis.loaders?.fetchNode) {
        return globalThis.loaders?.fetchNode(url, fetchOptions);
      }
      // throw new Error(
      //   'fetchFile: globalThis.loaders.fetchNode not defined. Install @loaders.gl/polyfills'
      // );
    }

    // Call global fetch
    return await fetch(url, fetchOptions);
  }

  // TODO - should we still call fetch on non-URL inputs?
  return await makeResponse(urlOrData);
}
