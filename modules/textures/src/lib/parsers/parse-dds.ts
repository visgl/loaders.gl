import type {TextureLevel} from '../../types';
import {assert} from '@loaders.gl/loader-utils';
import {GL} from '../gl-constants';
import {extractMipmapImages} from '../utils/extract-mipmap-images';

const getATCLevelSize = getDxt1LevelSize;
const getATCALevelSize = getDxtXLevelSize;
const getATCILevelSize = getDxtXLevelSize;
const DDS_CONSTANTS = {
  MAGIC_NUMBER: 0x20534444,
  HEADER_LENGTH: 31,
  MAGIC_NUMBER_INDEX: 0,
  HEADER_SIZE_INDEX: 1,
  HEADER_FLAGS_INDEX: 2,
  HEADER_HEIGHT_INDEX: 3,
  HEADER_WIDTH_INDEX: 4,
  MIPMAPCOUNT_INDEX: 7,
  HEADER_PF_FLAGS_INDEX: 20,
  HEADER_PF_FOURCC_INDEX: 21,
  DDSD_MIPMAPCOUNT: 0x20000,
  DDPF_FOURCC: 0x4,
  PIXEL_FORMATS: {
    DXT1: GL.COMPRESSED_RGB_S3TC_DXT1_EXT,
    DXT3: GL.COMPRESSED_RGBA_S3TC_DXT3_EXT,
    DXT5: GL.COMPRESSED_RGBA_S3TC_DXT5_EXT,
    'ATC ': GL.COMPRESSED_RGB_ATC_WEBGL,
    ATCA: GL.COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA_WEBGL,
    ATCI: GL.COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL
  },
  SIZE_FUNCTIONS: {
    DXT1: getDxt1LevelSize,
    DXT3: getDxtXLevelSize,
    DXT5: getDxtXLevelSize,
    'ATC ': getATCLevelSize,
    ATCA: getATCALevelSize,
    ATCI: getATCILevelSize
  }
};

/**
 * Check if data is in "DDS" format by its magic number
 * @param data - binary data of compressed texture
 * @returns true - data in "DDS" format, else - false
 */
export function isDDS(data: ArrayBuffer): boolean {
  const header = new Uint32Array(data, 0, DDS_CONSTANTS.HEADER_LENGTH);
  const magic = header[DDS_CONSTANTS.MAGIC_NUMBER_INDEX];
  return magic === DDS_CONSTANTS.MAGIC_NUMBER;
}

/**
 * Parse texture data as "DDS" format
 * @param data - binary data of compressed texture
 * @returns Array of the texture levels
 */
export function parseDDS(data: ArrayBuffer): TextureLevel[] {
  const header = new Int32Array(data, 0, DDS_CONSTANTS.HEADER_LENGTH);
  const pixelFormatNumber = header[DDS_CONSTANTS.HEADER_PF_FOURCC_INDEX];
  assert(
    Boolean(header[DDS_CONSTANTS.HEADER_PF_FLAGS_INDEX] & DDS_CONSTANTS.DDPF_FOURCC),
    'DDS: Unsupported format, must contain a FourCC code'
  );
  const fourCC = int32ToFourCC(pixelFormatNumber);
  const internalFormat = DDS_CONSTANTS.PIXEL_FORMATS[fourCC];
  const sizeFunction = DDS_CONSTANTS.SIZE_FUNCTIONS[fourCC];
  assert(internalFormat && sizeFunction, `DDS: Unknown pixel format ${pixelFormatNumber}`);

  let mipMapLevels = 1;
  if (header[DDS_CONSTANTS.HEADER_FLAGS_INDEX] & DDS_CONSTANTS.DDSD_MIPMAPCOUNT) {
    mipMapLevels = Math.max(1, header[DDS_CONSTANTS.MIPMAPCOUNT_INDEX]);
  }
  const width = header[DDS_CONSTANTS.HEADER_WIDTH_INDEX];
  const height = header[DDS_CONSTANTS.HEADER_HEIGHT_INDEX];
  const dataOffset = header[DDS_CONSTANTS.HEADER_SIZE_INDEX] + 4;
  const image = new Uint8Array(data, dataOffset);

  return extractMipmapImages(image, {
    mipMapLevels,
    width,
    height,
    sizeFunction,
    internalFormat
  });
}

/**
 * DXT1 applicable function to calculate level size
 * @param width - level width
 * @param height - level height
 * @returns level size in bytes
 */
export function getDxt1LevelSize(width: number, height: number): number {
  return ((width + 3) >> 2) * ((height + 3) >> 2) * 8;
}

/**
 * DXT3 & DXT5 applicable function to calculate level size
 * @param width - level width
 * @param height - level height
 * @returns level size in bytes
 */
export function getDxtXLevelSize(width: number, height: number): number {
  return ((width + 3) >> 2) * ((height + 3) >> 2) * 16;
}

/**
 * Convert every byte of Int32 value to char
 * @param {number} value - Int32 number
 * @returns {string} string of 4 characters
 */
function int32ToFourCC(value) {
  return String.fromCharCode(
    value & 0xff,
    (value >> 8) & 0xff,
    (value >> 16) & 0xff,
    (value >> 24) & 0xff
  );
}
