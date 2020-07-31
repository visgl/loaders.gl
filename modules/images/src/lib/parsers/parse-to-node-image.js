import {assert, global} from '@loaders.gl/loader-utils';
import {getBinaryImageMetadata} from '../api/binary-image-api';

// Use polyfills if installed to parsed image using get-pixels
export default function parseToNodeImage(arrayBuffer, options) {
  const metadata = getBinaryImageMetadata(arrayBuffer);
  // TODO - error handling
  const {mimeType} = metadata || {};

  // @ts-ignore
  const {_parseImageNode} = global;
  assert(_parseImageNode); // '@loaders.gl/polyfills not installed'

  return _parseImageNode(arrayBuffer, mimeType, options);
}
