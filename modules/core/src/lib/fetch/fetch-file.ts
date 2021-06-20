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
  url: string /* | Blob */,
  options?: {fetch?: RequestInit; throws?: boolean}
): Promise<Response> {
  if (typeof url !== 'string') {
    return await makeResponse(url);
  }

  url = resolvePath(url);

  const response = await fetch(url, options?.fetch);
  if (!response.ok && options?.throws) {
    throw new Error(await getErrorMessageFromResponse(response));
  }

  return response;
}
