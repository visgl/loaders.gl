import {isBrowser} from '@loaders.gl/loader-utils';
import type {ImageTypeEnum} from '../../types';

// @ts-ignore TS2339: Property does not exist on type
const parseImageNode = globalThis.loaders?.parseImageNode;

const IMAGE_SUPPORTED = typeof Image !== 'undefined'; // NOTE: "false" positives if jsdom is installed
const IMAGE_BITMAP_SUPPORTED = typeof ImageBitmap !== 'undefined';
const NODE_IMAGE_SUPPORTED = Boolean(parseImageNode);
const DATA_SUPPORTED = isBrowser ? true : NODE_IMAGE_SUPPORTED;

/**
 * Checks if a loaders.gl image type is supported
 * @param type image type string
 */
export function isImageTypeSupported(type: string): boolean {
  switch (type) {
    case 'auto':
      // Should only ever be false in Node.js, if polyfills have not been installed...
      return IMAGE_BITMAP_SUPPORTED || IMAGE_SUPPORTED || DATA_SUPPORTED;

    case 'imagebitmap':
      return IMAGE_BITMAP_SUPPORTED;
    case 'image':
      return IMAGE_SUPPORTED;
    case 'data':
      return DATA_SUPPORTED;

    default:
      throw new Error(`@loaders.gl/images: image ${type} not supported in this environment`);
  }
}

/**
 * Returns the "most performant" supported image type on this platform
 * @returns image type string
 */
export function getDefaultImageType(): ImageTypeEnum {
  if (IMAGE_BITMAP_SUPPORTED) {
    return 'imagebitmap';
  }
  if (IMAGE_SUPPORTED) {
    return 'image';
  }
  if (DATA_SUPPORTED) {
    return 'data';
  }

  // This should only happen in Node.js
  throw new Error('Install \'@loaders.gl/polyfills\' to parse images under Node.js');
}
