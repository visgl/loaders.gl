import type {LoaderContext} from '@loaders.gl/loader-utils';
import {assert, isBrowser} from '@loaders.gl/loader-utils';
import type {ImageType} from '../../types';
import type {ImageLoaderOptions} from '../../image-loader';
import {isImageTypeSupported, getDefaultImageType} from '../category-api/image-type';
import {getImageData} from '../category-api/parsed-image-api';
import {parseToImage} from './parse-to-image';
import {parseToImageBitmap} from './parse-to-image-bitmap';
import {parseToNodeImage} from './parse-to-node-image';

/**
 * Parses images into a compatibility image type based on `options.image.type`.
 */
// eslint-disable-next-line complexity
export async function parseImage(
  arrayBuffer: ArrayBuffer,
  options?: ImageLoaderOptions,
  context?: LoaderContext
): Promise<ImageType> {
  options = options || {};
  const imageOptions = options.image || {};
  const imageType = imageOptions.type || 'auto';
  const {url} = context || {};
  const hasNodeImageParser = Boolean(globalThis.loaders?.parseImageNode);
  const loadType = getLoadableImageType(imageType, hasNodeImageParser);

  let image;
  switch (loadType) {
    case 'imagebitmap':
      image =
        !isBrowser || hasNodeImageParser
          ? await parseToNodeImage(arrayBuffer, options)
          : await parseToImageBitmap(arrayBuffer, options, url);
      break;

    case 'image':
      image = await parseToImage(arrayBuffer, options, url);
      break;

    case 'data':
      image = await parseToNodeImage(arrayBuffer, options);
      break;

    default:
      assert(false);
  }

  if (imageType === 'data') {
    image = getImageData(image);
  }

  return image;
}

/**
 * Gets a loadable image type from the requested output type.
 */
function getLoadableImageType(
  type: string,
  hasNodeImageParser = false
): 'imagebitmap' | 'image' | 'data' {
  switch (type) {
    case 'auto':
    case 'data':
      return isBrowser && !hasNodeImageParser ? getDefaultImageType() : 'data';

    default:
      isImageTypeSupported(type);
      return type as 'imagebitmap' | 'image' | 'data';
  }
}
