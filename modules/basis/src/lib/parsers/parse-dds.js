import {assert} from '@loaders.gl/core/';
import {GL} from '../gl-constants';

export const DDS_CONSTANTS = {
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
    DXT5: GL.COMPRESSED_RGBA_S3TC_DXT5_EXT
  },
  SIZE_FUNCTIONS: {
    DXT1: getDxt1LevelSize,
    DXT3: getDxtXLevelSize,
    DXT5: getDxtXLevelSize
  }
};

export function parseDds(data) {
  const header = new Int32Array(data, 0, DDS_CONSTANTS.HEADER_LENGTH);
  const pixelFormatNumber = header[DDS_CONSTANTS.HEADER_PF_FOURCC_INDEX];
  assert(
    Boolean(header[DDS_CONSTANTS.HEADER_PF_FLAGS_INDEX] & DDS_CONSTANTS.DDPF_FOURCC),
    'Unsupported format, must contain a FourCC code'
  );
  const fourCC = int32ToFourCC(pixelFormatNumber);
  const internalFormat = DDS_CONSTANTS.PIXEL_FORMATS[fourCC];
  const sizeFunction = DDS_CONSTANTS.SIZE_FUNCTIONS[fourCC];

  let mipMapLevels = 1;
  if (header[DDS_CONSTANTS.HEADER_FLAGS_INDEX] & DDS_CONSTANTS.DDSD_MIPMAPCOUNT) {
    mipMapLevels = Math.max(1, header[DDS_CONSTANTS.MIPMAPCOUNT_INDEX]);
  }
  const width = header[DDS_CONSTANTS.HEADER_HEIGHT_INDEX];
  const height = header[DDS_CONSTANTS.HEADER_HEIGHT_INDEX];
  const dataOffset = header[DDS_CONSTANTS.HEADER_SIZE_INDEX] + 4;
  const image = new Uint8Array(data, dataOffset);

  const images = new Array(mipMapLevels);

  let levelWidth = width;
  let levelHeight = height;
  let offset = 0;

  for (let i = 0; i < mipMapLevels; ++i) {
    const levelSize = sizeFunction(levelWidth, levelHeight);
    images[i] = {
      compressed: true,
      format: internalFormat,
      data: new Uint8Array(image.buffer, image.byteOffset + offset, levelSize),
      width: levelWidth,
      height: levelHeight
    };

    levelWidth = Math.max(1, levelWidth >> 1);
    levelHeight = Math.max(1, levelHeight >> 1);

    offset += levelSize;
  }

  return images;
}

function int32ToFourCC(value) {
  return String.fromCharCode(
    value & 0xff,
    (value >> 8) & 0xff,
    (value >> 16) & 0xff,
    (value >> 24) & 0xff
  );
}

function getDxt1LevelSize(width, height) {
  return ((width + 3) >> 2) * ((height + 3) >> 2) * 8;
}

function getDxtXLevelSize(width, height) {
  return ((width + 3) >> 2) * ((height + 3) >> 2) * 16;
}
