import assert from '../utils/assert';
import {isImageTypeSupported, getDefaultImageType} from '../parsed-image-api/image-type';

import parseToNodeImage from './parse-to-node-image';
import parseToImage from './parse-to-image';
import parseToImageBitmap from './parse-to-image-bitmap';
import parseSVG from './parse-svg';

// Parse to platform defined image type (ndarray on node, ImageBitmap or HTMLImage on browser)
export default async function parseImage(arrayBuffer, options, context) {
  options = options || {};

  const {url} = context || {};
  if (url && /\.svg((\?|#).*)?$/.test(url)) {
    // eslint-disable-next-line
    console.warn('@loaders.gl/images: SVG parsing needs to be fixed for 2.0');
    return await parseSVG(arrayBuffer, options);
  }

  const format = getImageOutputFormat(options);
  switch (format) {
    case 'imagebitmap':
      return await parseToImageBitmap(arrayBuffer, options);
    case 'html':
      return await parseToImage(arrayBuffer, options);
    case 'ndarray':
      return await parseToNodeImage(arrayBuffer, options);
    default:
      return assert(false);
  }
}

// The user can request a specific output format via `options.type`
// TODO - ImageBitmap vs HTMLImage depends on worker threads...
function getImageOutputFormat(options = {}) {
  const imageOptions = options.image || {};
  const type = imageOptions.type || 'auto';

  switch (type) {
    case 'imagebitmap':
    case 'html':
    case 'ndarray':
      // Check that it is actually supported
      if (!isImageTypeSupported(type)) {
        throw new Error(`Requested image type ${type} not available in current environment`);
      }
      return type;

    case 'auto':
      return getDefaultImageType();

    default:
      // Note: isImageTypeSupported throws on unknown type
      throw new Error(`Unknown image format ${type}`);
  }
}
