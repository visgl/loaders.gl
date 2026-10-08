/** Resolves an absolute asset URL only when its scheme is safe for browser links and fetches. */
export function getCatalogAssetUrl(href: string): URL | undefined {
  try {
    const assetUrl = new URL(href);
    if (assetUrl.protocol === 'https:' || assetUrl.protocol === 'http:') return assetUrl;
  } catch {
    // Invalid and relative URLs cannot be fetched by this preview.
  }
  return undefined;
}
