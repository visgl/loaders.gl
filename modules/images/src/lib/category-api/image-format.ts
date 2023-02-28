// loaders.gl, MIT license

import {isBrowser} from '@loaders.gl/loader-utils';

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

/** Only one round of tests is performed */
const mimeTypeSupportedPromise: Promise<Set<string>> | null = null;

/** Run-time browser detection of file formats requires async tests for most precise results */
export async function getSupportedImageFormats(): Promise<Set<string>> {
  if (mimeTypeSupportedPromise) {
    return await mimeTypeSupportedPromise;
  }

  const supportedMimeTypes = new Set<string>();
  for (const mimeType of MIME_TYPES) {
    const supported = isBrowser
      ? await checkBrowserImageFormatSupportAsync(mimeType)
      : checkNodeImageFormatSupport(mimeType);
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
      : checkNodeImageFormatSupport(mimeType);
    mimeTypeSupportedSync[mimeType] = supported;
  }
  return mimeTypeSupportedSync[mimeType];
}

/**
 * Checks that polyfills are installed and that mimeType is supported by polyfills
 * @todo Ideally polyfills should declare what formats they support, instead of storing that data here.
 */
function checkNodeImageFormatSupport(mimeType: string): boolean {
  /** @deprecated Remove these in 4.0 and rely on polyfills to inject them */
  const NODE_FORMAT_SUPPORT = ['image/png', 'image/jpeg', 'image/gif'];
  // @ts-ignore
  const {_parseImageNode, _imageFormatsNode = NODE_FORMAT_SUPPORT} = globalThis;
  return Boolean(_parseImageNode) && _imageFormatsNode.includes(mimeType);
}

/** Checks image format support synchronously.
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
