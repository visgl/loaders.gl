import {isImageTypeSupported, getDefaultImageType} from '../parsed-image-api/image-type';

// The user can request a specific output format via `options.type`
// TODO - ImageBitmap vs HTMLImage depends on worker threads...
export default function getImageOutputFormat(options = {}) {
  const imageOptions = options.image || {};
  const type = imageOptions.type || 'auto';

  switch (type) {
    case 'imagebitmap':
    case 'html':
    case 'ndarray':
      // Check that it is actually supported
      if (!isImageTypeSupported(type)) {
        throw new Error(`Requested image type ${type} not available in current environment`);
      }
      return type;

    case 'auto':
      return getDefaultImageType();

    default:
      // Note: isImageTypeSupported throws on unknown type
      throw new Error(`Unknown image format ${type}`);
  }
}
