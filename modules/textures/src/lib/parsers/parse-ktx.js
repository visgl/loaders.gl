import {read} from 'ktx-parse';
import {extractMipmapImages} from '../utils/extract-mipmap-images';
import {GL} from '../gl-constants';

const KTX2_ID = [
  // '´', 'K', 'T', 'X', '2', '0', 'ª', '\r', '\n', '\x1A', '\n'
  0xab,
  0x4b,
  0x54,
  0x58,
  0x20,
  0x32,
  0x30,
  0xbb,
  0x0d,
  0x0a,
  0x1a,
  0x0a
];

// Vulkan format to WebGl format mapping provided here http://github.khronos.org/KTX-Specification/#formatMapping
// Vulkan name to format number mapping provided here: https://www.khronos.org/registry/vulkan/specs/1.2-extensions/man/html/VkFormat.html
const PIXEL_FORMATS = {
  131: GL.COMPRESSED_RGB_S3TC_DXT1_EXT,
  132: GL.COMPRESSED_SRGB_S3TC_DXT1_EXT,
  133: GL.COMPRESSED_RGBA_S3TC_DXT1_EXT,
  134: GL.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT,
  135: GL.COMPRESSED_RGBA_S3TC_DXT3_EXT,
  136: GL.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT,
  137: GL.COMPRESSED_RGBA_S3TC_DXT5_EXT,
  138: GL.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT,
  139: GL.COMPRESSED_RED_RGTC1_EXT,
  140: GL.COMPRESSED_SIGNED_RED_RGTC1_EXT,
  141: GL.COMPRESSED_RED_GREEN_RGTC2_EXT,
  142: GL.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT,
  147: GL.COMPRESSED_RGB8_ETC2,
  148: GL.COMPRESSED_SRGB8_ETC2,
  149: GL.COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2,
  150: GL.COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2,
  151: GL.COMPRESSED_RGBA8_ETC2_EAC,
  152: GL.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC,
  153: GL.COMPRESSED_R11_EAC,
  154: GL.COMPRESSED_SIGNED_R11_EAC,
  155: GL.COMPRESSED_RG11_EAC,
  156: GL.COMPRESSED_SIGNED_RG11_EAC,
  157: GL.COMPRESSED_RGBA_ASTC_4x4_KHR,
  158: GL.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR,
  159: GL.COMPRESSED_RGBA_ASTC_5x4_KHR,
  160: GL.COMPRESSED_SRGB8_ALPHA8_ASTC_5X4_KHR,
  161: GL.COMPRESSED_RGBA_ASTC_5x5_KHR,
  162: GL.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR,
  163: GL.COMPRESSED_RGBA_ASTC_6x5_KHR,
  164: GL.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR,
  165: GL.COMPRESSED_RGBA_ASTC_6x6_KHR,
  166: GL.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR,
  167: GL.COMPRESSED_RGBA_ASTC_8x5_KHR,
  168: GL.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR,
  169: GL.COMPRESSED_RGBA_ASTC_8x6_KHR,
  170: GL.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR,
  171: GL.COMPRESSED_RGBA_ASTC_8x8_KHR,
  172: GL.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR,
  173: GL.COMPRESSED_RGBA_ASTC_10x5_KHR,
  174: GL.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR,
  175: GL.COMPRESSED_RGBA_ASTC_10x6_KHR,
  176: GL.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR,
  177: GL.COMPRESSED_RGBA_ASTC_10x8_KHR,
  178: GL.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR,
  179: GL.COMPRESSED_RGBA_ASTC_10x10_KHR,
  180: GL.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR,
  181: GL.COMPRESSED_RGBA_ASTC_12x10_KHR,
  182: GL.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR,
  183: GL.COMPRESSED_RGBA_ASTC_12x12_KHR,
  184: GL.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR
};

// eslint-disable-next-line complexity
export function isKTX(data) {
  const id = new Uint8Array(data.buffer || data, data.byteOffset || 0, KTX2_ID.length);
  const notKTX =
    id[0] !== KTX2_ID[0] || // '´'
    id[1] !== KTX2_ID[1] || // 'K'
    id[2] !== KTX2_ID[2] || // 'T'
    id[3] !== KTX2_ID[3] || // 'X'
    id[4] !== KTX2_ID[4] || // ' '
    id[5] !== KTX2_ID[5] || // '2'
    id[6] !== KTX2_ID[6] || // '0'
    id[7] !== KTX2_ID[7] || // 'ª'
    id[8] !== KTX2_ID[8] || // '\r'
    id[9] !== KTX2_ID[9] || // '\n'
    id[10] !== KTX2_ID[10] || // '\x1A'
    id[11] !== KTX2_ID[11]; // '\n'

  return !notKTX;
}

export function parseKTX(arrayBuffer) {
  const uint8Array = new Uint8Array(arrayBuffer);
  const ktx = read(uint8Array);
  const mipMapLevels = Math.max(1, ktx.levels.length);
  const width = ktx.pixelWidth;
  const height = ktx.pixelHeight;
  const internalFormat = PIXEL_FORMATS[ktx.vkFormat];

  return extractMipmapImages(ktx.levels, {
    mipMapLevels,
    width,
    height,
    sizeFunction: level => level.uncompressedByteLength,
    internalFormat
  });
}
