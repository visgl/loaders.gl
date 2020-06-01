
/**
 * Returns data bytes representing a compressed image in PNG or JPG format,
 * This data can be saved using file system (f) methods or used in a request.
 * @param image - Image or Canvas
 * @param mimeType 
 * TODO clean up
 * param {String} opt.type='png' - png, jpg or image/png, image/jpg are valid
 * param {String} opt.dataURI= - Whether to include a data URI header
 */
export function encodeImage(image: any, mimeType: string): ArrayBuffer;
