import {global} from '../utils/globals';
import {getBinaryImageMetadata} from '../category-api/binary-image-api';

// Use polyfills if installed to p[arsed image using get-pixels
export default function parseToNodeImage(arrayBuffer, options) {
  const {mimeType} = getBinaryImageMetadata(arrayBuffer) || {};

  // @ts-ignore
  const {_parseImageNode} = global;
  return _parseImageNode(arrayBuffer, mimeType, options);
}
