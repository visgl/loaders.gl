/**
 * Image type string used to control or determine the type of images returned from ImageLoader
 */
export type ImageType = 'imagebitmap' | 'image' | 'data';

/**
 * Checks if a loaders.gl image type is supported
 * @param type image type string
 */
export function isImageTypeSupported(type: ImageType): boolean;

/**
 * Returns the "most performant" supported image type on this platform
 * @returns image type string
 */
export function getDefaultImageType(): ImageType;
