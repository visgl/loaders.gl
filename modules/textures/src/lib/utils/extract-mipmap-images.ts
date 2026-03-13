// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GLTextureFormat, TextureLevel} from '@loaders.gl/schema';
import {getTextureFormatFromWebGLFormat} from './texture-format-map';

export type CompressedTextureExtractOptions = {
  mipMapLevels: number;
  width: number;
  height: number;
  sizeFunction: Function;
  internalFormat?: GLTextureFormat;
};

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
  data: Uint8Array | object[],
  options: CompressedTextureExtractOptions
): TextureLevel[] {
  const images = new Array(options.mipMapLevels);
  const format = options.internalFormat;
  const textureFormat = format === undefined ? undefined : getTextureFormatFromWebGLFormat(format);

  let levelWidth = options.width;
  let levelHeight = options.height;
  let offset = 0;

  for (let i = 0; i < options.mipMapLevels; ++i) {
    // @ts-expect-error
    const levelSize = getLevelSize(options, levelWidth, levelHeight, data, i);
    // @ts-expect-error
    const levelData = getLevelData(data, i, offset, levelSize);

    const image: TextureLevel = {
      shape: 'texture-level',
      compressed: true,
      data: levelData,
      width: levelWidth,
      height: levelHeight,
      levelSize
    };

    if (format !== undefined) {
      image.format = format;
    }
    if (textureFormat) {
      image.textureFormat = textureFormat;
    }
    images[i] = image;

    levelWidth = Math.max(1, levelWidth >> 1);
    levelHeight = Math.max(1, levelHeight >> 1);

    offset += levelSize;
  }
  return images;
}

function getLevelData(
  data: Uint8Array,
  index: number,
  offset: number,
  levelSize: number
): Uint8Array {
  if (!Array.isArray(data)) {
    return new Uint8Array(data.buffer, data.byteOffset + offset, levelSize);
  }

  return data[index].levelData;
}

function getLevelSize(
  options: CompressedTextureExtractOptions,
  levelWidth: number,
  levelHeight: number,
  data: Uint8Array[] | object[],
  index: number
): number {
  if (!Array.isArray(data)) {
    return options.sizeFunction(levelWidth, levelHeight);
  }
  return options.sizeFunction(data[index]);
}
