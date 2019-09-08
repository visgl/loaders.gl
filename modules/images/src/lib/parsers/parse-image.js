import assert from '../../utils/assert';

import getImageOutputFormat from './get-image-output-format';
import parseToNodeImage from './parse-to-node-image';
import parseToHTMLImage from './parse-to-html-image';
import parseToImageBitmap from './parse-to-image-bitmap';

// Parse to platform defined image type (ndarray on node, ImageBitmap or HTMLImage on browser)
export async function parseImage(arrayBuffer, options) {
  const format = getImageOutputFormat(options);
  switch (format) {
    case 'imagebitmap':
      return await parseToImageBitmap(arrayBuffer, options);
    case 'html':
      return await parseToHTMLImage(arrayBuffer, options);
    case 'ndarray':
      return await parseToNodeImage(arrayBuffer, options);
    default:
      return assert(false);
  }
}
