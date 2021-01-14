import {resolvePath, assert} from '@loaders.gl/loader-utils';

// Generate a url by calling getUrl with mix of options, applying options.baseUrl
export function generateUrl(getUrl, options, urlOptions) {
  // Get url
  let url = getUrl;
  if (typeof getUrl === 'function') {
    url = getUrl({...options, ...urlOptions});
  }
  assert(typeof url === 'string');

  // Apply options.baseUrl
  const {baseUrl} = options;
  if (baseUrl) {
    url = baseUrl[baseUrl.length - 1] === '/' ? `${baseUrl}${url}` : `${baseUrl}/${url}`;
  }

  return resolvePath(url);
}
