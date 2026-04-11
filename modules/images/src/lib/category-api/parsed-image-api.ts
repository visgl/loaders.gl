import type {ImageType, ImageTypeEnum, ImageDataType} from '../../types';

type GetImageBitmapDataNode = (image: unknown) => ImageDataType | ImageData;
type IsImageBitmapNode = (image: unknown) => boolean;

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

export function getImageType(image: ImageType): ImageTypeEnum {
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

    case 'imagebitmap':
      if (isNodeImageBitmap(image)) {
        return getNodeImageData(image);
      }
      return getBrowserImageData(image);

    case 'image':
      return getBrowserImageData(image);

    default:
      throw new Error('getImageData');
  }
}

function isNodeImageBitmap(image: ImageType): boolean {
  const isImageBitmapNode: IsImageBitmapNode | undefined = globalThis.loaders?.isImageBitmapNode;
  return Boolean(isImageBitmapNode?.(image));
}

function getNodeImageData(image: ImageType): ImageDataType | ImageData {
  const getImageBitmapDataNode: GetImageBitmapDataNode | undefined =
    globalThis.loaders?.getImageBitmapDataNode;
  if (!getImageBitmapDataNode) {
    throw new Error('getImageData');
  }

  return getImageBitmapDataNode(image);
}

function getBrowserImageData(image: ImageType): ImageData | ImageDataType {
  // Extract the image data from the image via a canvas
  const canvas = createBrowserCanvas(image.width, image.height);
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
}

/**
 * Creates a browser-compatible canvas in either the window or worker runtime.
 * @param width - Canvas width in pixels.
 * @param height - Canvas height in pixels.
 * @returns Canvas instance that supports a 2D drawing context.
 */
function createBrowserCanvas(width: number, height: number): HTMLCanvasElement | OffscreenCanvas {
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(width, height);
  }

  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }

  throw new Error('getImageData');
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
