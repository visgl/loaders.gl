import type {LoaderOptions} from '@loaders.gl/loader-utils';
import {resolvePath} from '@loaders.gl/loader-utils';
import {makeResponse} from '../utils/response-utils';
import {getErrorMessageFromResponse} from './fetch-error-message';

/**
 * As fetch but respects pathPrefix and file aliases
 * Reads file data from:
 * - data urls
 * - http/http urls
 * - File/Blob objects
 */
export async function fetchFile(
  url: string | Blob,
  options?: RequestInit & {fetch?: RequestInit | Function; throws?: boolean}
): Promise<Response> {
  if (typeof url === 'string') {
    url = resolvePath(url);

    let fetchOptions: RequestInit = options as RequestInit;
    if (options?.fetch && typeof options?.fetch !== `function`) {
      fetchOptions = options.fetch;
    }

    const response = await fetch(url as string, fetchOptions);
    if (!response.ok && options?.throws) {
      throw new Error(await getErrorMessageFromResponse(response));
    }
  
    return response;
  }

  return await makeResponse(url);
}
