import {CompressedTextureExtractOptions, TextureLevel} from '@loaders.gl/textures/types/texture';

/**
 * Extract mimpap images from compressed texture buffer
 * @param data - binary data of compressed texture or Array of level objects
 * @param options.mipMapLevels - number of mipmap level inside image
 * @param options.width - width of 0 - level
 * @param options.height - height of 0 - level
 * @param options.sizeFunction - format-related function to calculate level size in bytes
 * @param options.internalFormat - WebGL compatible format code
 * @returns Array of the texture levels
 */
export function extractMipmapImages(
  data: Uint8Array | Array<Object>,
  options: CompressedTextureExtractOptions
): TextureLevel[];
