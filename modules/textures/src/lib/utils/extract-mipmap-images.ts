import {CompressedTextureExtractOptions, TextureLevel} from '@loaders.gl/textures/types/texture';

/**
 * Extract mipmap images from compressed texture buffer
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
): TextureLevel[] {
  const images = new Array(options.mipMapLevels);

  let levelWidth = options.width;
  let levelHeight = options.height;
  let offset = 0;

  for (let i = 0; i < options.mipMapLevels; ++i) {
    const levelSize = getLevelSize(options, levelWidth, levelHeight, data, i);
    const levelData = getLevelData(data, i, offset, levelSize);

    images[i] = {
      compressed: true,
      format: options.internalFormat,
      data: levelData,
      width: levelWidth,
      height: levelHeight,
      levelSize
    };

    levelWidth = Math.max(1, levelWidth >> 1);
    levelHeight = Math.max(1, levelHeight >> 1);

    offset += levelSize;
  }
  return images;
}

function getLevelData(data, index, offset, levelSize) {
  if (!Array.isArray(data)) {
    return new Uint8Array(data.buffer, data.byteOffset + offset, levelSize);
  }

  return data[index].levelData;
}

function getLevelSize(options, levelWidth, levelHeight, data, index) {
  if (!Array.isArray(data)) {
    return options.sizeFunction(levelWidth, levelHeight);
  }
  return options.sizeFunction(data[index]);
}
