// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TextureLevel} from '@loaders.gl/schema';
import {loadCrunchModule} from './crunch-module-loader';
import {GL_EXTENSIONS_CONSTANTS} from '../gl-extensions';
import {assert} from '@loaders.gl/loader-utils';
import {getDxt1LevelSize, getDxtXLevelSize} from './parse-dds';
import {extractMipmapImages} from '../utils/extract-mipmap-images';

// Taken from crnlib.h
const CRN_FORMAT = {
  cCRNFmtInvalid: -1,

  cCRNFmtDXT1: 0,
  // cCRNFmtDXT3 is not currently supported when writing to CRN - only DDS.
  cCRNFmtDXT3: 1,
  cCRNFmtDXT5: 2

  // Crunch supports more formats than this.
};

/** Mapping of Crunch formats to DXT formats. */
const DXT_FORMAT_MAP = {
  [CRN_FORMAT.cCRNFmtDXT1]: {
    pixelFormat: GL_EXTENSIONS_CONSTANTS.COMPRESSED_RGB_S3TC_DXT1_EXT,
    sizeFunction: getDxt1LevelSize
  },
  [CRN_FORMAT.cCRNFmtDXT3]: {
    pixelFormat: GL_EXTENSIONS_CONSTANTS.COMPRESSED_RGBA_S3TC_DXT3_EXT,
    sizeFunction: getDxtXLevelSize
  },
  [CRN_FORMAT.cCRNFmtDXT5]: {
    pixelFormat: GL_EXTENSIONS_CONSTANTS.COMPRESSED_RGBA_S3TC_DXT5_EXT,
    sizeFunction: getDxtXLevelSize
  }
};

let cachedDstSize = 0;
let dst: number;

/**
 * Parse texture data as "CRN" format.
 * Function is "async" as emscriptified decoder module is loaded asyncronously
 * @param data - binary data of compressed texture
 * @returns Promise of Array of the texture levels
 */
export async function parseCrunch(data, options: any): Promise<TextureLevel[]> {
  const crunchModule = await loadCrunchModule(options);

  // Copy the contents of the arrayBuffer into emscriptens heap.
  const srcSize = data.byteLength;
  const bytes = new Uint8Array(data);
  const src = crunchModule._malloc(srcSize);
  arrayBufferCopy(bytes, crunchModule.HEAPU8, src, srcSize);

  // Determine what type of compressed data the file contains.
  const format = crunchModule._crn_get_dxt_format(src, srcSize);
  assert(Boolean(DXT_FORMAT_MAP[format]), 'Unsupported format');

  // Gather basic metrics about the DXT data.
  const mipMapLevels = crunchModule._crn_get_levels(src, srcSize);
  const width = crunchModule._crn_get_width(src, srcSize);
  const height = crunchModule._crn_get_height(src, srcSize);
  // const bytesPerBlock = crunchModule._crn_get_bytes_per_block(src, srcSize);

  // Determine the size of the decoded DXT data.
  const sizeFunction = DXT_FORMAT_MAP[format].sizeFunction;
  let dstSize = 0;
  for (let i = 0; i < mipMapLevels; ++i) {
    dstSize += sizeFunction(width >> i, height >> i);
  }

  // Allocate enough space on the emscripten heap to hold the decoded DXT data
  // or reuse the existing allocation if a previous call to this function has
  // already acquired a large enough buffer.
  if (cachedDstSize < dstSize) {
    if (dst) {
      crunchModule._free(dst);
    }
    dst = crunchModule._malloc(dstSize);
    cachedDstSize = dstSize;
  }

  // Decompress the DXT data from the Crunch file into the allocated space.
  crunchModule._crn_decompress(src, srcSize, dst, dstSize, 0, mipMapLevels);

  // Release the crunch file data from the emscripten heap.
  crunchModule._free(src);

  const image = new Uint8Array(crunchModule.HEAPU8.buffer, dst, dstSize).slice();
  return extractMipmapImages(image, {
    mipMapLevels,
    width,
    height,
    sizeFunction,
    internalFormat: DXT_FORMAT_MAP[format].pixelFormat
  });
}

/**
 * Copy an array of bytes into or out of the emscripten heap
 * @param {Uint8Array} srcData - Source data array
 * @param {Uint8Array} dstData - Destination data array
 * @param {number} dstByteOffset - Destination data offset
 * @param {number} numBytes - number of bytes to copy
 * @returns {void}
 */
function arrayBufferCopy(srcData, dstData, dstByteOffset, numBytes) {
  let i;
  const dst32Offset = dstByteOffset / 4;
  const tail = numBytes % 4;
  const src32 = new Uint32Array(srcData.buffer, 0, (numBytes - tail) / 4);
  const dst32 = new Uint32Array(dstData.buffer);
  for (i = 0; i < src32.length; i++) {
    dst32[dst32Offset + i] = src32[i];
  }
  for (i = numBytes - tail; i < numBytes; i++) {
    dstData[dstByteOffset + i] = srcData[i];
  }
}
