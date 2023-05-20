// loaders.gl, MIT license

import {isBrowser} from '@loaders.gl/loader-utils';
import {PARSE_IMAGE_NODE_FORMATS} from '../parsers/parse-image-node';
// import {ENCODE_IMAGE_NODE_FORMATS} from '../encoders/encode-image-node';

const MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/avif',
  'image/tiff',
  // TODO - what is the correct type for SVG
  'image/svg',
  'image/svg+xml',
  'image/bmp',
  'image/vnd.microsoft.icon'
];

/** Cache results, so that only one round of run-time tests is performed */
const cachedMimeTypesPromise: Promise<Set<string>> | null = null;

/**
 * Returns the mime types of image file formats that can be loaded and/or written
 * by the current browser or Node.js environment
 *
 * @note This function is async: run-time  detection of file format support in browsers requires async tests for most precise results
 */
export async function getSupportedImageFormats(): Promise<Set<string>> {
  if (cachedMimeTypesPromise) {
    return await cachedMimeTypesPromise;
  }

  const supportedMimeTypes = new Set<string>();
  for (const mimeType of MIME_TYPES) {
    const supported = isBrowser
      ? await checkBrowserImageFormatSupportAsync(mimeType)
      : PARSE_IMAGE_NODE_FORMATS[mimeType];
    if (supported) {
      supportedMimeTypes.add(mimeType);
    }
  }

  return supportedMimeTypes;
}

/** Cache sync values for speed */
const mimeTypeSupportedSync: {[mimeType: string]: boolean} = {};

/**
 * Check if image MIME type is supported. Result is cached to avoid repeated tests.
 */
export function isImageFormatSupported(mimeType: string): boolean {
  if (mimeTypeSupportedSync[mimeType] === undefined) {
    const supported = isBrowser
      ? checkBrowserImageFormatSupport(mimeType)
      : PARSE_IMAGE_NODE_FORMATS.has(mimeType);
    mimeTypeSupportedSync[mimeType] = supported;
  }
  return mimeTypeSupportedSync[mimeType];
}

/**
 * Checks image format support synchronously.
 * @note Unreliable, fails on AVIF
 */
function checkBrowserImageFormatSupport(mimeType: string): boolean {
  switch (mimeType) {
    case 'image/avif': // Will fail
    case 'image/webp':
      return testBrowserImageFormatSupport(mimeType);
    default:
      return true;
  }
}

const TEST_IMAGE = {
  'image/avif':
    'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=',
  // Lossy test image. Support for lossy images doesn't guarantee support for all WebP images.
  'image/webp': 'data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA'
};

/** Checks WebP and AVIF support asynchronously */
async function checkBrowserImageFormatSupportAsync(mimeType: string): Promise<boolean> {
  const dataURL = TEST_IMAGE[mimeType];
  return dataURL ? await testBrowserImageFormatSupportAsync(dataURL) : true;
}

/**
 * Checks browser synchronously
 * Checks if toDataURL supports the mimeType.
 * @note Imperfect testOn Chrome this is true for WebP but not for AVIF
 */
function testBrowserImageFormatSupport(mimeType: string): boolean {
  try {
    const element = document.createElement('canvas');
    const dataURL = element.toDataURL(mimeType);
    return dataURL.indexOf(`data:${mimeType}`) === 0;
  } catch {
    // Probably Safari...
    return false;
  }
}

// Check WebPSupport asynchronously
async function testBrowserImageFormatSupportAsync(testImageDataURL: string): Promise<boolean> {
  return new Promise((resolve) => {
    const image = new Image();
    image.src = testImageDataURL;
    image.onload = () => resolve(image.height > 0);
    image.onerror = () => resolve(false);
  });
}
