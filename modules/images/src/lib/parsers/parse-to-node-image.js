import {global} from '../utils/globals';
import assert from '../utils/assert';
import {getBinaryImageMIMEType} from '../binary-image-api/binary-image-api';

// Use polyfills if installed to p[arsed image using get-pixels
export default function parseToNodeImage(arrayBuffer, options) {
  assert(global._parseImageNode); // '@loaders.gl/polyfills not installed'
  const mimeType = getBinaryImageMIMEType(arrayBuffer);
  return global._parseImageNode(arrayBuffer, mimeType, options);
}
