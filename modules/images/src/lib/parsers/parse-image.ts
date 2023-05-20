import type {LoaderContext} from '@loaders.gl/loader-utils';
import {assert} from '@loaders.gl/loader-utils';
import type {ImageType} from '../../types';
import type {ImageLoaderOptions} from '../../image-loader';
import {isImageTypeSupported, getDefaultImageType} from '../category-api/image-type';
import {getImageData} from '../category-api/parsed-image-api';
import {parseToHTMLImage} from './parse-to-html-image';
import {parseToImageBitmap} from './parse-to-image-bitmap';
import {parseImageNode} from './parse-image-node';

// Parse to platform defined image type (data on node, ImageBitmap or HTMLImage on browser)
// eslint-disable-next-line complexity
export async function parseImage(
  arrayBuffer: ArrayBuffer,
  options?: ImageLoaderOptions,
  context?: LoaderContext
): Promise<ImageType> {
  options = options || {};
  const imageOptions = options.image || {};

  // The user can request a specific output format via `options.image.type`
  const imageType = imageOptions.type || 'auto';

  const {url} = context || {};

  // Note: For options.image.type === `data`, we may still need to load as `image` or `imagebitmap`
  const loadType = getLoadableImageType(imageType);

  let image;
  switch (loadType) {
    case 'imagebitmap':
      image = await parseToImageBitmap(
        arrayBuffer,
        options?.image,
        options?.imageBitmap || options?.imagebitmap,
        url
      );
      break;
    case 'image':
      image = await parseToHTMLImage(arrayBuffer, options, url);
      break;
    case 'data':
      // Node.js loads imagedata directly
      image = await parseImageNode(arrayBuffer, options);
      break;
    default:
      assert(false);
  }

  // Browser: if options.image.type === 'data', we can now extract data from the loaded image
  if (imageType === 'data') {
    image = getImageData(image);
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
