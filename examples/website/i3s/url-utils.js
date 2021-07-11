export function parseTilesetUrlFromUrl() {
  const parsedUrl = new URL(window.location.href);
  return parsedUrl.searchParams.get('url');
}

export function parseTilesetUrlParams(url, options) {
  const parsedUrl = new URL(url);
  let token = options && options.token;
  const tilesetUrl = prepareTilesetUrl(parsedUrl);
  const index = tilesetUrl.lastIndexOf('/layers/0');
  let metadataUrl = tilesetUrl.substring(0, index);

  if (parsedUrl.search) {
    token = parsedUrl.searchParams.get('token');
    metadataUrl = `${metadataUrl}${parsedUrl.search}`;
  }

  return {...options, tilesetUrl, token, metadataUrl};
}

function prepareTilesetUrl(parsedUrl) {
  if (parsedUrl.pathname.includes('layers/0')) {
    return parsedUrl.href;
  }
  // Add '/' to url if needed + layers/0 if not exists in url.
  const replacedPathName = parsedUrl.pathname.replace(/\/?$/, '/').concat('layers/0');
  return `${parsedUrl.origin}${replacedPathName}${parsedUrl.search}`;
}
