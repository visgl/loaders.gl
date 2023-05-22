/**
 * data for images
 */
export type ImageDataType = {
  shape?: 'data';
  data: Uint8Array | Uint8ClampedArray;
  width: number;
  height: number;
  compressed?: boolean;
};

/**
 * Supported Image Types
 */
export type ImageType = ImageBitmap | ImageDataType | HTMLImageElement;

/**
 * Image type string used to control or determine the type of images returned from ImageLoader
 */
export type ImageShape =
  | 'imagebitmap'
  | 'data'
  /** @deprecated As of loaders.gl 4.0, imagebitmap is now universally supported  */
  | 'image';
