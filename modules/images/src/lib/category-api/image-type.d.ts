import {ImageTypeEnum} from '../../types';

/**
 * Checks if a loaders.gl image type is supported
 * @param type image type string
 */
export function isImageTypeSupported(type: string): boolean;

/**
 * Returns the "most performant" supported image type on this platform
 * @returns image type string
 */
export function getDefaultImageType(): ImageTypeEnum;
