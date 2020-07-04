
export type ImageDataType = {
  data: Uint8Array;
  width: number;
  height: number;
}

/**
 * 
 */
export type ImageType = ImageBitmap | typeof Image | ImageDataType;

/**
 * 
  * param {String} opt.type='png' - png, jpg or image/png, image/jpg are valid
  * param {String} opt.dataURI= - Whether to include a data URI header 
 */
export type EncodeImageOptions = {
  mimeType: 'image/png' | 'image/jpg',
  // dataURI: - Whether to include a data URI header 
}

/**
 * Returns data bytes representing a compressed image in PNG or JPG format,
 * This data can be saved using file system (f) methods or used in a request.
 * @param image - ImageBitmap Image or Canvas
 * @param options 
 * param opt.type='png' - png, jpg or image/png, image/jpg are valid
 * param mimeType= - Whether to include a data URI header
 */
export function encodeImage(image: any, options?: EncodeImageOptions): ArrayBuffer;
