import type {LoaderContext, StrictLoaderOptions} from '@loaders.gl/loader-utils';

// Resolves a relative url against a baseUrl
// If url is absolute, return it unchanged
export function resolveUrl(url: string, options?: StrictLoaderOptions, context?: LoaderContext) {
  // TODO: Use better logic to handle all protocols plus not delay on data
  const absolute = url.startsWith('data:') || url.startsWith('http:') || url.startsWith('https:');
  if (absolute) {
    return url;
  }
  const baseUrl = context?.baseUrl || getResolveBaseUrl(options?.core?.baseUrl);
  if (!baseUrl) {
    throw new Error(`'baseUrl' must be provided to resolve relative url ${url}`);
  }
  return baseUrl.endsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`;
}

function getResolveBaseUrl(baseUrl?: string): string | undefined {
  if (!baseUrl) {
    return undefined;
  }

  if (baseUrl.endsWith('/')) {
    return baseUrl;
  }

  const slashIndex = baseUrl.lastIndexOf('/');
  return slashIndex >= 0 ? baseUrl.slice(0, slashIndex + 1) : '';
}
