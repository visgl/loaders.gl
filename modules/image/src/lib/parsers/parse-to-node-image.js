import {global} from '../utils/globals';
import assert from '../utils/assert';
import {getBinaryImageMetadata} from '../api/binary-image-metadata';

// Use polyfills if installed to p[arsed image using get-pixels
export default function parseToNodeImage(arrayBuffer, options) {
  const metadata = getBinaryImageMetadata(arrayBuffer);
  // TODO - error handling
  const {mimeType} = metadata || {};

  // @ts-ignore
  const {_parseImageNode} = global;
  assert(_parseImageNode); // '@loaders.gl/polyfills not installed'

  return _parseImageNode(arrayBuffer, mimeType, options);
}
