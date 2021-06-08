import {TextureLevel} from '@loaders.gl/textures/types/texture';

/**
 * Check if data is in "PVR" format by its magic number
 * @param data - binary data of compressed texture
 * @returns true - data in "PVR" format, else - false
 */
export function isPVR(data: ArrayBuffer): boolean;

/**
 * Parse texture data as "PVR" format
 * @param data - binary data of compressed texture
 * @returns Array of the texture levels
 */
export function parsePVR(data: ArrayBuffer): TextureLevel[];
