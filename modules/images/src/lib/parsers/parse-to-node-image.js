import {global} from '../utils/globals';
import assert from '../utils/assert';
import {getBinaryImageMIMEType} from '../binary-image-api/binary-image-api';

export const NODE_IMAGE_SUPPORTED = Boolean(global._parseImageNode);

// Parse to platform defined type (ndarray on node, ImageBitmap on browser)
export default function parseToNodeImage(arrayBuffer, options) {
  assert(global._parseImageNode); // '@loaders.gl/polyfills not installed'
  const mimeType = getBinaryImageMIMEType(arrayBuffer);
  return global._parseImageNode(arrayBuffer, mimeType, options);
}
