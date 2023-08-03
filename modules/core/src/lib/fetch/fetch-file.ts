// loaders.gl, MIT license

import {resolvePath} from '@loaders.gl/loader-utils';
import {makeResponse} from '../utils/response-utils';

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

    // Call global fetch
    return await fetch(url, fetchOptions);
  }

  // TODO - should we still call fetch on non-URL inputs?
  return await makeResponse(urlOrData);
}
