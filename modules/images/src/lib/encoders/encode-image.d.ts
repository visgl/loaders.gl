/**
 * Returns data bytes representing a compressed image in PNG or JPG format,
 * This data can be saved using file system (f) methods or used in a request.
 * @param image - ImageBitmap Image or Canvas
 * @param options
 * param opt.type='png' - png, jpg or image/png, image/jpg are valid
 * param mimeType= - Whether to include a data URI header
 */
export function encodeImage(image: any, options?: object): Promise<ArrayBuffer>;
