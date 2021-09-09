const WEBP_TEST_IMAGES = {
  lossy: 'UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA',
  lossless: 'UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==',
  alpha:
    'UklGRkoAAABXRUJQVlA4WAoAAAAQAAAAAAAAAAAAQUxQSAwAAAARBxAR/Q9ERP8DAABWUDggGAAAABQBAJ0BKgEAAQAAAP4AAA3AAP7mtQAAAA==',
  animation:
    'UklGRlIAAABXRUJQVlA4WAoAAAASAAAAAAAAAAAAQU5JTQYAAAD/////AABBTk1GJgAAAAAAAAAAAAAAAAAAAGQAAABWUDhMDQAAAC8AAAAQBxAREYiI/gcA'
};

export type WebPFeature = 'lossy' | 'lossless' | 'alpha' | 'animation';

const WEBP_FEATURES: WebPFeature[] = ['lossy', 'lossless', 'alpha', 'animation'];

/**
 * Checks if WebP is supported
 * @param features Array, can include 'lossy', 'lossless', 'alpha' or 'animation'
 */
export async function isWebPSupported(features: WebPFeature[] = WEBP_FEATURES): Promise<boolean> {
  const promises = features.map((feature) => checkWebPFeature(feature));
  const statuses = await Promise.all(promises);
  return statuses.every((_) => _);
}

/**
 * Checks if a specific WebP feature is supported
 * @param feature 'feature' can be one of 'lossy', 'lossless', 'alpha' or 'animation'.
 *
 * Based on Google's official recommended checks
 * @see https://developers.google.com/speed/webp/faq#how_can_i_detect_browser_support_for_webp
 */
async function checkWebPFeature(feature: WebPFeature): Promise<boolean> {
  if (typeof Image === 'undefined') {
    return false;
  }
  return await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img.width > 0 && img.height > 0);
    img.onerror = () => resolve(false);
    img.src = `data:image/webp;base64,${WEBP_TEST_IMAGES[feature]}`;
  });
}
