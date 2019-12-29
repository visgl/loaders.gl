import assert from '../utils/assert';
import {isImageTypeSupported, getDefaultImageType} from '../parsed-image-api/image-type';
import {getImageData} from '../parsed-image-api/parsed-image-api';
import parseToImage from './parse-to-image';
import parseToImageBitmap from './parse-to-image-bitmap';
import parseToNodeImage from './parse-to-node-image';
import parseSVG from './parse-svg';

const SVG_DATA_URL_PATTERN = /^data:image\/svg\+xml/;
const SVG_URL_PATTERN = /\.svg((\?|#).*)?$/;

// Parse to platform defined image type (data on node, ImageBitmap or HTMLImage on browser)
// eslint-disable-next-line complexity
export default async function parseImage(arrayBuffer, options, context) {
  options = options || {};
  const imageOptions = options.image || {};

  // The user can request a specific output format via `options.image.type`
  const imageType = imageOptions.type || 'auto';

  const {url} = context || {};
  if (url && (SVG_DATA_URL_PATTERN.test(url) || SVG_URL_PATTERN.test(url))) {
    // TODO - This path does not handle the same options...
    // eslint-disable-next-line
    console.warn('@loaders.gl/images: SVG parsing is limited, not all options supported');
    return await parseSVG(arrayBuffer, options);
  }

  // Note: For options.image.type === `data`, we may still need to load as `image` or `imagebitmap`
  const loadType = getLoadableImageType(imageType);

  let image;
  switch (loadType) {
    case 'imagebitmap':
      return await parseToImageBitmap(arrayBuffer, options);
    case 'image':
      image = await parseToImage(arrayBuffer, options);
      break;
    case 'data':
      // Node.js loads imagedata directly
      image = await parseToNodeImage(arrayBuffer, options);
      break;
    default:
      assert(false);
  }

  // Browser: if options.image.type === 'data', we can now extract data from the loaded image
  if (imageType === 'data') {
    image = getImageData(image, false);
  }

  return image;
}

// Get a loadable image type from image type
function getLoadableImageType(type) {
  switch (type) {
    case 'auto':
    case 'data':
      // Browser: For image data we need still need to load using an image format
      // Node: the default image type is `data`.
      return getDefaultImageType();
    default:
      // Throw an error if not supported
      isImageTypeSupported(type);
      return type;
  }
}
