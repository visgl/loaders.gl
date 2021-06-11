import type {ImageType, ImageTypeEnum, ImageDataType} from '../../types';

export function isImage(image: ImageType): boolean {
  return Boolean(getImageTypeOrNull(image));
}

export function deleteImage(image: ImageType): void {
  switch (getImageType(image)) {
    case 'imagebitmap':
      (image as ImageBitmap).close();
      break;
    default:
    // Nothing to do for images and image data objects
  }
}

export function getImageType(image: ImageType, throwOnError?: boolean): ImageTypeEnum {
  const format = getImageTypeOrNull(image);
  if (!format) {
    throw new Error('Not an image');
  }
  return format;
}

export function getImageSize(image: ImageType): {width: number; height: number} {
  return getImageData(image);
}

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
function getImageTypeOrNull(image) {
  if (typeof ImageBitmap !== 'undefined' && image instanceof ImageBitmap) {
    return 'imagebitmap';
  }
  if (typeof Image !== 'undefined' && image instanceof Image) {
    return 'image';
  }
  if (image && typeof image === 'object' && image.data && image.width && image.height) {
    return 'data';
  }
  return null;
}
