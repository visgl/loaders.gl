import {global} from '../utils/globals';
import {assert} from '../utils/assert';
import {getBinaryImageMetadata} from '../category-api/binary-image-api';

// Use polyfills if installed to p[arsed image using get-pixels
export default function parseToNodeImage(arrayBuffer, options) {
  const {mimeType} = getBinaryImageMetadata(arrayBuffer) || {};

  // @ts-ignore
  const {_parseImageNode} = global;
  assert(_parseImageNode); // '@loaders.gl/polyfills not installed'

  return _parseImageNode(arrayBuffer, mimeType, options);
}
