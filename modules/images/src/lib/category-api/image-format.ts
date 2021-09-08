import {isBrowser} from '@loaders.gl/loader-utils';

// The following formats are supported by loaders.gl polyfills
const NODE_FORMAT_SUPPORT = ['image/png', 'image/jpeg', 'image/gif'];

/** Cache values for speed */
const mimeTypeSupported: {[mimeType: string]: boolean} = {};

/**
 * Check if image MIME type is supported. Result is cached.
 */
export function _isImageFormatSupported(mimeType: string): boolean {
  if (mimeTypeSupported[mimeType] === undefined) {
    mimeTypeSupported[mimeType] = checkFormatSupport(mimeType);
  }
  return mimeTypeSupported[mimeType];
}

/**
 * Check if image MIME type is supported.
 */
function checkFormatSupport(mimeType: string): boolean {
  switch (mimeType) {
    case 'image/webp':
      return checkWebPSupport();
    case 'image/svg':
      return isBrowser;
    default:
      if (!isBrowser) {
        // @ts-ignore
        const {_parseImageNode} = globalThis;
        return Boolean(_parseImageNode) && NODE_FORMAT_SUPPORT.includes(mimeType);
      }
      return true;
  }
}

/** Check WebPSupport synchronously */
function checkWebPSupport() {
  if (!isBrowser) {
    return false;
  }
  try {
    const element = document.createElement('canvas');
    return element.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  } catch {
    // Probably Safari...
    return false;
  }
}

// Note: better test but asynchronous

// Lossy test image. Support for lossy images doesn't guarantee support for all WebP images.
// https://stackoverflow.com/questions/5573096/detecting-webp-support
// const WEBP_TEST_IMAGE = 'data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA';

// Check WebPSupport asynchronously
// async function isWebPSupported() {
//   return new Promise( resolve => {
//     const image = new Image();
//     image.src = WEBP_TEST_IMAGE;
//     image.onload = image.onerror = function () {
//     resolve( image.height === 1 );
//   }
// }
