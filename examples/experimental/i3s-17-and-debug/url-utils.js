export function createTilesetUrl(parsedUrl) {
  if (parsedUrl.pathname.includes('layers/0')) {
    return parsedUrl.href;
  }
  // Add '/' to url if needed + layers/0 if not exists in url.
  const replacedPathName = parsedUrl.pathname.replace(/\/?$/, '/').concat('layers/0');
  return `${parsedUrl.origin}${replacedPathName}${parsedUrl.search}`;
}
