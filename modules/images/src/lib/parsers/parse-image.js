import assert from '../utils/assert';

import getImageOutputFormat from './get-image-output-format';
import parseToNodeImage from './parse-to-node-image';
import parseToHTMLImage from './parse-to-html-image';
import parseToImageBitmap from './parse-to-image-bitmap';
import parseSVG from './parse-svg';

// Parse to platform defined image type (ndarray on node, ImageBitmap or HTMLImage on browser)
export default async function parseImage(arrayBuffer, options, context) {
  if ('image' in options) {
    options = {...options, image: {}};
  }

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
      return await parseToHTMLImage(arrayBuffer, options);
    case 'ndarray':
      return await parseToNodeImage(arrayBuffer, options);
    default:
      return assert(false);
  }
}
