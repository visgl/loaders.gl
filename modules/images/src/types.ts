/**
 * data images
 */
export type ImageDataType = {
  data: Uint8Array;
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
export type ImageTypeEnum = 'imagebitmap' | 'image' | 'data';
