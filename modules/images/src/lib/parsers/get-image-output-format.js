import {NODE_IMAGE_SUPPORTED} from './parse-to-node-image';
import {HTML_IMAGE_SUPPORTED} from './parse-to-html-image';
import {IMAGE_BITMAP_SUPPORTED} from './parse-to-image-bitmap';

import {isBrowser} from '../utils/globals';
import assert from '../utils/assert';
import {ImageLoaders} from '../../image-loaders';

// The user can request a specific output format
// If using loaders.gl to load images for HTML
// TODO - should this throw or silently return the available format?
// TODO - ImageBitmap vs HTMLImage depends on worker threads...
export default function getImageOutputFormat(options = {}) {
  const imageOptions = options.image || {};
  const requestedFormat = imageOptions.format || 'auto';
  switch (requestedFormat) {
    case 'imagebitmap':
      assert(IMAGE_BITMAP_SUPPORTED);
      return requestedFormat;
    case 'html':
      assert(HTML_IMAGE_SUPPORTED);
      return requestedFormat;
    default:
    // warn?
    // fall through
    case 'auto':
      if (NODE_IMAGE_SUPPORTED) {
        return 'ndarray';
      }
      if (!isBrowser) {
        throw new Error(`Install '@loaders.gl/polyfills' to parse images under Node.js`);
      }
      if (IMAGE_BITMAP_SUPPORTED) {
        return 'imagebitmap';
      }
      if (HTML_IMAGE_SUPPORTED) {
        return 'html';
      }
      return assert(false);
  }
}
