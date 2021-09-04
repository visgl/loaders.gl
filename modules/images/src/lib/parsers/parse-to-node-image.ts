import {assert} from '@loaders.gl/loader-utils';
import {getBinaryImageMetadata} from '../category-api/binary-image-api';

// Use polyfills if installed to p[arsed image using get-pixels
export default function parseToNodeImage(arrayBuffer, options) {
  const {mimeType} = getBinaryImageMetadata(arrayBuffer) || {};

  // @ts-ignore
  const {_parseImageNode} = globalThis;
  assert(_parseImageNode); // '@loaders.gl/polyfills not installed'

  return _parseImageNode(arrayBuffer, mimeType, options);
}
