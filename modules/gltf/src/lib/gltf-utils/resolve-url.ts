// Resolves a relative url against a baseUrl
// If url is absolute, return it unchanged
export function resolveUrl(url, options) {
  // TODO: Use better logic to handle all protocols plus not delay on data
  const absolute = url.startsWith('data:') || url.startsWith('http:') || url.startsWith('https:');
  if (absolute) {
    return url;
  }
  const baseUrl = options.baseUri || options.uri;
  if (!baseUrl) {
    throw new Error(`'baseUri' must be provided to resolve relative url ${url}`);
  }
  return baseUrl.substr(0, baseUrl.lastIndexOf('/') + 1) + url;
}
