// loaders.gl, MIT license

const QUERY_STRING_PATTERN = /\?.*/;

export function extractQueryString(url): string {
  const matches = url.match(QUERY_STRING_PATTERN);
  return matches && matches[0];
}

export function stripQueryString(url): string {
  return url.replace(QUERY_STRING_PATTERN, '');
}
