import { TextureLevel } from "@loaders.gl/textures/types/textrure";

/**
 * Deduces format and parses compressed texture loaded in ArrayBuffer
 * @param data - binary data of compressed texture
 * @returns Array of the texture levels
 */
export function parseCompressedTexture(data: ArrayBuffer): TextureLevel[];