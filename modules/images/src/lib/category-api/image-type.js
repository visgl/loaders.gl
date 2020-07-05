/* global ImageBitmap, Image */
import {global, isBrowser, isWorker} from '../utils/globals';

// @ts-ignore TS2339: Property does not exist on type
const {_parseImageNode} = global;

// NOTE: "false" positives if jsdom is installed
const IMAGE_SUPPORTED = typeof Image !== 'undefined' && !isWorker; // NOTE: "false" positives if jsdom is installed
const IMAGE_BITMAP_SUPPORTED = typeof ImageBitmap !== 'undefined';
const NODE_IMAGE_SUPPORTED = Boolean(_parseImageNode);
const DATA_SUPPORTED = isBrowser ? true : NODE_IMAGE_SUPPORTED;

const ERR_INSTALL_POLYFILLS = `Install '@loaders.gl/polyfills' to parse images under Node.js`;

// Checks if a loaders.gl image type is supported
export function isImageTypeSupported(type) {
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

    // DEPRECATED types
    case 'html':
      return IMAGE_SUPPORTED;
    case 'ndarray':
      return DATA_SUPPORTED;

    default:
      throw new Error(`@loaders.gl/images: unknown image type ${type}`);
  }
}

// Returns the best loaders.gl image type supported on current run-time environment
export function getDefaultImageType() {
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
  throw new Error(ERR_INSTALL_POLYFILLS);
}
