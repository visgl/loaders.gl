import {global} from '../utils/globals';
import assert from '../utils/assert';
import {getBinaryImageMIMEType} from '../binary-image-api/binary-image-api';

// Use polyfills if installed to p[arsed image using get-pixels
export default function parseToNodeImage(arrayBuffer, options) {
  const mimeType = getBinaryImageMIMEType(arrayBuffer);

  // @ts-ignore
  const {_parseImageNode} = global;
  assert(_parseImageNode); // '@loaders.gl/polyfills not installed'

  return _parseImageNode(arrayBuffer, mimeType, options);
}
