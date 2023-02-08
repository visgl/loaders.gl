import {isBrowser,resolvePath} from '@loaders.gl/loader-utils';
import {makeResponse} from '../utils/response-utils';
import {fetchFileNode} from './fetch-file.node';
// import {getErrorMessageFromResponse} from './fetch-error-message';

const isDataURL = (url: string): boolean => url.startsWith('data:');
const isRequestURL = (url: string): boolean => url.startsWith('http:') || url.startsWith('https:');

/**
 * fetch compatible function
 * Reads file data from:
 * - http/http urls
 * - data urls
 * - File/Blob objects
 * Leverages `@loaders.gl/polyfills` for Node.js support
 * Respects pathPrefix and file aliases
 */
export async function fetchFile(
  url: string | Blob,
  options?: RequestInit & {fetch?: RequestInit | Function}
): Promise<Response> {
  if (typeof url === 'string') {
    url = resolvePath(url);

    // Support for file URLs in node.js
    if (!isBrowser && !isRequestURL(url) && !isDataURL(url)) {
      return await fetchFileNode(url, options);
    }
    
    let fetchOptions: RequestInit = options as RequestInit;
    if (options?.fetch && typeof options?.fetch !== 'function') {
      fetchOptions = options.fetch;
    }

    return await fetch(url, fetchOptions);
  }

  return await makeResponse(url);
}
