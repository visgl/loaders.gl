import type {ImageType, ImageShape, ImageDataType} from '../../types';

/** Returns true if ImageBitmaps are supported. If not, ImageDataType is always supported  */
export function isImageBitmapSupported() {
  return typeof ImageBitmap !== 'undefined';
}

/** Returns true of the argument is an image that can be handled by these functions */
export function isImage(image: unknown): boolean {
  return Boolean(getImageShapeOrNull(image));
}

/** Deletes resources associated with an image */
export function deleteImage(image: ImageType): void {
  switch (getImageType(image)) {
    case 'imagebitmap':
      (image as ImageBitmap).close();
      break;
    default:
    // Nothing to do for images and image data objects
  }
}

/**
 * Returns the "shape" of an image.
 * @deprecated From v4.0
 */
export function getImageType(image: ImageType): ImageShape {
  const format = getImageShapeOrNull(image);
  if (!format) {
    throw new Error('Not an image');
  }
  return format;
}

/** Gets the size of an image */
export function getImageSize(image: ImageType): {width: number; height: number} {
  return getImageData(image);
}

/** Gets image data from an image */
export function getImageData(image: ImageType): ImageDataType | ImageData {
  switch (getImageType(image)) {
    case 'data':
      return image as unknown as ImageData;

    case 'image':
    case 'imagebitmap':
      // Extract the image data from the image via a canvas
      const canvas = document.createElement('canvas');
      // TODO - reuse the canvas?
      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('getImageData');
      }
      // @ts-ignore
      canvas.width = image.width;
      // @ts-ignore
      canvas.height = image.height;
      // @ts-ignore
      context.drawImage(image, 0, 0);
      // @ts-ignore
      return context.getImageData(0, 0, image.width, image.height);

    default:
      throw new Error('getImageData');
  }
}

// PRIVATE

// eslint-disable-next-line complexity
function getImageShapeOrNull(image: unknown) {
  if (typeof ImageBitmap !== 'undefined' && image instanceof ImageBitmap) {
    return 'imagebitmap';
  }
  if (typeof Image !== 'undefined' && image instanceof Image) {
    return 'image';
  }
  const imageData = image as ImageDataType;
  if (image && typeof image === 'object' && imageData.data && imageData.width && imageData.height) {
    return 'data';
  }
  return null;
}
