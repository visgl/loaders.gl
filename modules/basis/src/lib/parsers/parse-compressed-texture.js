// Forked from PicoGL: https://github.com/tsherif/picogl.js/blob/master/examples/utils/utils.js
// Copyright (c) 2017 Tarek Sherif, The MIT License (MIT)

const PVR_CONSTANTS = {
  MAGIC_NUMBER: 0x03525650,
  HEADER_LENGTH: 13,
  HEADER_SIZE: 52,
  MAGIC_NUMBER_INDEX: 0,
  PIXEL_FORMAT_INDEX: 2,
  HEIGHT_INDEX: 6,
  WIDTH_INDEX: 7,
  MIPMAPCOUNT_INDEX: 11,
  METADATA_SIZE_INDEX: 12,
  FORMATS: {
    0: 'COMPRESSED_RGB_PVRTC_2BPPV1_IMG',
    1: 'COMPRESSED_RGBA_PVRTC_2BPPV1_IMG',
    2: 'COMPRESSED_RGB_PVRTC_4BPPV1_IMG',
    3: 'COMPRESSED_RGBA_PVRTC_4BPPV1_IMG',
    6: 'COMPRESSED_RGB8_ETC2',
    7: 'COMPRESSED_RGB_S3TC_DXT1_EXT',
    9: 'COMPRESSED_RGBA_S3TC_DXT3_EXT',
    11: 'COMPRESSED_RGBA_S3TC_DXT5_EXT',
    22: 'COMPRESSED_RGB8_ETC2',
    23: 'COMPRESSED_RGBA8_ETC2_EAC',
    24: 'COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2',
    25: 'COMPRESSED_R11_EAC',
    26: 'COMPRESSED_RG11_EAC',
    27: 'COMPRESSED_RGBA_ASTC_4x4_KHR',
    28: 'COMPRESSED_RGBA_ASTC_5x4_KHR',
    29: 'COMPRESSED_RGBA_ASTC_5x5_KHR',
    30: 'COMPRESSED_RGBA_ASTC_6x5_KHR',
    31: 'COMPRESSED_RGBA_ASTC_6x6_KHR',
    32: 'COMPRESSED_RGBA_ASTC_8x5_KHR',
    33: 'COMPRESSED_RGBA_ASTC_8x6_KHR',
    34: 'COMPRESSED_RGBA_ASTC_8x8_KHR',
    35: 'COMPRESSED_RGBA_ASTC_10x5_KHR',
    36: 'COMPRESSED_RGBA_ASTC_10x6_KHR',
    37: 'COMPRESSED_RGBA_ASTC_10x8_KHR',
    38: 'COMPRESSED_RGBA_ASTC_10x10_KHR',
    39: 'COMPRESSED_RGBA_ASTC_12x10_KHR',
    40: 'COMPRESSED_RGBA_ASTC_12x12_KHR'
  },
  SIZE_FUNCTIONS: {
    0: pvrtc2bppSize,
    1: pvrtc2bppSize,
    2: pvrtc4bppSize,
    3: pvrtc4bppSize,
    6: dxtEtcSmallSize,
    7: dxtEtcSmallSize,
    9: dxtEtcAstcBigSize,
    11: dxtEtcAstcBigSize,
    22: dxtEtcSmallSize,
    23: dxtEtcAstcBigSize,
    24: dxtEtcSmallSize,
    25: dxtEtcSmallSize,
    26: dxtEtcAstcBigSize,
    27: dxtEtcAstcBigSize,
    28: atc5x4Size,
    29: atc5x5Size,
    30: atc6x5Size,
    31: atc6x6Size,
    32: atc8x5Size,
    33: atc8x6Size,
    34: atc8x8Size,
    35: atc10x5Size,
    36: atc10x6Size,
    37: atc10x8Size,
    38: atc10x10Size,
    39: atc12x10Size,
    40: atc12x12Size
  }
};

// http://cdn.imgtec.com/sdk-documentation/PVR+File+Format.Specification.pdf
export function parseCompressedTexture(data) {
  const header = new Uint32Array(data, 0, PVR_CONSTANTS.HEADER_LENGTH);

  const pvrFormat = header[PVR_CONSTANTS.PIXEL_FORMAT_INDEX];

  const formatEnum = PVR_CONSTANTS.FORMATS[pvrFormat];
  const sizeFunction = PVR_CONSTANTS.SIZE_FUNCTIONS[pvrFormat];

  const mipMapLevels = header[PVR_CONSTANTS.MIPMAPCOUNT_INDEX];

  const width = header[PVR_CONSTANTS.WIDTH_INDEX];
  const height = header[PVR_CONSTANTS.HEIGHT_INDEX];

  const dataOffset = PVR_CONSTANTS.HEADER_SIZE + header[PVR_CONSTANTS.METADATA_SIZE_INDEX];

  const image = new Uint8Array(data, dataOffset);

  const images = new Array(mipMapLevels);

  let levelWidth = width;
  let levelHeight = height;
  let offset = 0;

  for (let i = 0; i < mipMapLevels; ++i) {
    const levelSize = sizeFunction(levelWidth, levelHeight);
    images[i] = {
      compressed: true,
      format: formatEnum,
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

// https://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_pvrtc/
function pvrtc2bppSize(width, height) {
  width = Math.max(width, 16);
  height = Math.max(height, 8);

  return (width * height) / 4;
}

// https://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_pvrtc/
function pvrtc4bppSize(width, height) {
  width = Math.max(width, 8);
  height = Math.max(height, 8);

  return (width * height) / 2;
}

// https://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_s3tc/
// https://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_etc/
// Size for:
// COMPRESSED_RGB_S3TC_DXT1_EXT
// COMPRESSED_R11_EAC
// COMPRESSED_SIGNED_R11_EAC
// COMPRESSED_RGB8_ETC2
// COMPRESSED_SRGB8_ETC2
// COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2
// COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2
function dxtEtcSmallSize(width, height) {
  return Math.floor((width + 3) / 4) * Math.floor((height + 3) / 4) * 8;
}

// https://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_s3tc/
// https://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_etc/
// https://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_astc/
// Size for:
// COMPRESSED_RGBA_S3TC_DXT3_EXT
// COMPRESSED_RGBA_S3TC_DXT5_EXT
// COMPRESSED_RG11_EAC
// COMPRESSED_SIGNED_RG11_EAC
// COMPRESSED_RGBA8_ETC2_EAC
// COMPRESSED_SRGB8_ALPHA8_ETC2_EAC
// COMPRESSED_RGBA_ASTC_4x4_KHR
function dxtEtcAstcBigSize(width, height) {
  return Math.floor((width + 3) / 4) * Math.floor((height + 3) / 4) * 16;
}

// https://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_astc/
function atc5x4Size(width, height) {
  return Math.floor((width + 4) / 5) * Math.floor((height + 3) / 4) * 16;
}

// https://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_astc/
function atc5x5Size(width, height) {
  return Math.floor((width + 4) / 5) * Math.floor((height + 4) / 5) * 16;
}

// https://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_astc/
function atc6x5Size(width, height) {
  return Math.floor((width + 5) / 6) * Math.floor((height + 4) / 5) * 16;
}

// https://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_astc/
function atc6x6Size(width, height) {
  return Math.floor((width + 5) / 6) * Math.floor((height + 5) / 6) * 16;
}

// https://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_astc/
function atc8x5Size(width, height) {
  return Math.floor((width + 7) / 8) * Math.floor((height + 4) / 5) * 16;
}

// https://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_astc/
function atc8x6Size(width, height) {
  return Math.floor((width + 7) / 8) * Math.floor((height + 5) / 6) * 16;
}

// https://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_astc/
function atc8x8Size(width, height) {
  return Math.floor((width + 7) / 8) * Math.floor((height + 7) / 8) * 16;
}

// https://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_astc/
function atc10x5Size(width, height) {
  return Math.floor((width + 9) / 10) * Math.floor((height + 4) / 5) * 16;
}

// https://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_astc/
function atc10x6Size(width, height) {
  return Math.floor((width + 9) / 10) * Math.floor((height + 5) / 6) * 16;
}

// https://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_astc/
function atc10x8Size(width, height) {
  return Math.floor((width + 9) / 10) * Math.floor((height + 7) / 8) * 16;
}

// https://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_astc/
function atc10x10Size(width, height) {
  return Math.floor((width + 9) / 10) * Math.floor((height + 9) / 10) * 16;
}

// https://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_astc/
function atc12x10Size(width, height) {
  return Math.floor((width + 11) / 12) * Math.floor((height + 9) / 10) * 16;
}

// https://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_astc/
function atc12x12Size(width, height) {
  return Math.floor((width + 11) / 12) * Math.floor((height + 11) / 12) * 16;
}
