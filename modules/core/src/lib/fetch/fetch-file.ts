// loaders.gl, MIT license

import {resolvePath} from '@loaders.gl/loader-utils';
import {makeResponse} from '../utils/response-utils';
import * as node from './fetch-file.node';

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
    if (isNodePath(url) && node?.fetchFileNode) {
      return node.fetchFileNode(url, fetchOptions);
    }

    const response = await fetch(url, fetchOptions);
    return response;
  }

  // TODO - should we still call fetch on non-URL inputs?
  return await makeResponse(urlOrData);
}
