import {resolvePath} from '@loaders.gl/loader-utils';
import {makeResponse} from '../utils/response-utils';
// import {getErrorMessageFromResponse} from './fetch-error-message';

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

    let fetchOptions: RequestInit = options as RequestInit;
    if (options?.fetch && typeof options?.fetch !== 'function') {
      fetchOptions = options.fetch;
    }

    return await fetch(url, fetchOptions);
  }

  return await makeResponse(url);
}
