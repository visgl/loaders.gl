import { TextureLevel } from "@loaders.gl/textures/types/texture";

/**
 * Check if data is in "DDS" format by its magic number
 * @param data - binary data of compressed texture
 * @returns true - data in "DDS" format, else - false
 */
export function isDDS(data: ArrayBuffer): boolean;

/**
 * Parse texture data as "DDS" format
 * @param data - binary data of compressed texture
 * @returns Array of the texture levels
 */
export function parseDDS(data: ArrayBuffer): TextureLevel[];

/**
 * DXT1 applicable function to calculate level size
 * @param width - level width
 * @param height - level height
 * @returns level size in bytes
 */
export function getDxt1LevelSize(width: number, height: number): number;

/**
 * DXT3 & DXT5 applicable function to calculate level size
 * @param width - level width
 * @param height - level height
 * @returns level size in bytes
 */
export function getDxtXLevelSize(width: number, height: number): number;