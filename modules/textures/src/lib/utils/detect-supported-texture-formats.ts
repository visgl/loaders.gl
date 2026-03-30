// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GPUTextureFormat, TextureFormat} from '@loaders.gl/schema';

const BROWSER_PREFIXES = ['', 'WEBKIT_', 'MOZ_'];

const WEBGL_TEXTURE_FORMATS: {[key: string]: TextureFormat[]} = {
  /* eslint-disable camelcase */
  WEBGL_compressed_texture_s3tc: [
    'bc1-rgb-unorm-webgl',
    'bc1-rgba-unorm',
    'bc2-rgba-unorm',
    'bc3-rgba-unorm'
  ],
  WEBGL_compressed_texture_s3tc_srgb: [
    'bc1-rgb-unorm-srgb-webgl',
    'bc1-rgba-unorm-srgb',
    'bc2-rgba-unorm-srgb',
    'bc3-rgba-unorm-srgb'
  ],
  EXT_texture_compression_rgtc: ['bc4-r-unorm', 'bc4-r-snorm', 'bc5-rg-unorm', 'bc5-rg-snorm'],
  EXT_texture_compression_bptc: [
    'bc6h-rgb-ufloat',
    'bc6h-rgb-float',
    'bc7-rgba-unorm',
    'bc7-rgba-unorm-srgb'
  ],
  WEBGL_compressed_texture_etc1: ['etc1-rgb-unorm-webgl'],
  WEBGL_compressed_texture_etc: [
    'etc2-rgb8unorm',
    'etc2-rgb8unorm-srgb',
    'etc2-rgb8a1unorm',
    'etc2-rgb8a1unorm-srgb',
    'etc2-rgba8unorm',
    'etc2-rgba8unorm-srgb',
    'eac-r11unorm',
    'eac-r11snorm',
    'eac-rg11unorm',
    'eac-rg11snorm'
  ],
  WEBGL_compressed_texture_pvrtc: [
    'pvrtc-rgb4unorm-webgl',
    'pvrtc-rgba4unorm-webgl',
    'pvrtc-rgb2unorm-webgl',
    'pvrtc-rgba2unorm-webgl'
  ],
  WEBGL_compressed_texture_atc: [
    'atc-rgb-unorm-webgl',
    'atc-rgba-unorm-webgl',
    'atc-rgbai-unorm-webgl'
  ],
  WEBGL_compressed_texture_astc: [
    'astc-4x4-unorm',
    'astc-4x4-unorm-srgb',
    'astc-5x4-unorm',
    'astc-5x4-unorm-srgb',
    'astc-5x5-unorm',
    'astc-5x5-unorm-srgb',
    'astc-6x5-unorm',
    'astc-6x5-unorm-srgb',
    'astc-6x6-unorm',
    'astc-6x6-unorm-srgb',
    'astc-8x5-unorm',
    'astc-8x5-unorm-srgb',
    'astc-8x6-unorm',
    'astc-8x6-unorm-srgb',
    'astc-8x8-unorm',
    'astc-8x8-unorm-srgb',
    'astc-10x5-unorm',
    'astc-10x5-unorm-srgb',
    'astc-10x6-unorm',
    'astc-10x6-unorm-srgb',
    'astc-10x8-unorm',
    'astc-10x8-unorm-srgb',
    'astc-10x10-unorm',
    'astc-10x10-unorm-srgb',
    'astc-12x10-unorm',
    'astc-12x10-unorm-srgb',
    'astc-12x12-unorm',
    'astc-12x12-unorm-srgb'
  ]
  /* eslint-enable camelcase */
};

const GPU_TEXTURE_FORMATS: {[key in GPUTextureFormat]: TextureFormat[]} = {
  dxt: ['bc1-rgb-unorm-webgl', 'bc1-rgba-unorm', 'bc2-rgba-unorm', 'bc3-rgba-unorm'],
  'dxt-srgb': [
    'bc1-rgb-unorm-srgb-webgl',
    'bc1-rgba-unorm-srgb',
    'bc2-rgba-unorm-srgb',
    'bc3-rgba-unorm-srgb'
  ],
  etc1: ['etc1-rgb-unorm-webgl'],
  etc2: [
    'etc2-rgb8unorm',
    'etc2-rgb8unorm-srgb',
    'etc2-rgb8a1unorm',
    'etc2-rgb8a1unorm-srgb',
    'etc2-rgba8unorm',
    'etc2-rgba8unorm-srgb',
    'eac-r11unorm',
    'eac-r11snorm',
    'eac-rg11unorm',
    'eac-rg11snorm'
  ],
  pvrtc: [
    'pvrtc-rgb4unorm-webgl',
    'pvrtc-rgba4unorm-webgl',
    'pvrtc-rgb2unorm-webgl',
    'pvrtc-rgba2unorm-webgl'
  ],
  atc: ['atc-rgb-unorm-webgl', 'atc-rgba-unorm-webgl', 'atc-rgbai-unorm-webgl'],
  astc: [
    'astc-4x4-unorm',
    'astc-4x4-unorm-srgb',
    'astc-5x4-unorm',
    'astc-5x4-unorm-srgb',
    'astc-5x5-unorm',
    'astc-5x5-unorm-srgb',
    'astc-6x5-unorm',
    'astc-6x5-unorm-srgb',
    'astc-6x6-unorm',
    'astc-6x6-unorm-srgb',
    'astc-8x5-unorm',
    'astc-8x5-unorm-srgb',
    'astc-8x6-unorm',
    'astc-8x6-unorm-srgb',
    'astc-8x8-unorm',
    'astc-8x8-unorm-srgb',
    'astc-10x5-unorm',
    'astc-10x5-unorm-srgb',
    'astc-10x6-unorm',
    'astc-10x6-unorm-srgb',
    'astc-10x8-unorm',
    'astc-10x8-unorm-srgb',
    'astc-10x10-unorm',
    'astc-10x10-unorm-srgb',
    'astc-12x10-unorm',
    'astc-12x10-unorm-srgb',
    'astc-12x12-unorm',
    'astc-12x12-unorm-srgb'
  ],
  rgtc: ['bc4-r-unorm', 'bc4-r-snorm', 'bc5-rg-unorm', 'bc5-rg-snorm']
};

let formats: Set<GPUTextureFormat> | null = null;
let textureFormats: Set<TextureFormat> | null = null;

// DEPRECATED
/**
 * @deprecated Pass `basis.supportedTextureFormats` to Basis loaders instead of relying on global detection.
 */
export function detectSupportedTextureFormats(gl?: WebGLRenderingContext): Set<TextureFormat> {
  if (!textureFormats) {
    gl = gl || getWebGLContext() || undefined;
    textureFormats = new Set<TextureFormat>();

    for (const prefix of BROWSER_PREFIXES) {
      for (const extension in WEBGL_TEXTURE_FORMATS) {
        if (gl && gl.getExtension(`${prefix}${extension}`)) {
          for (const textureFormat of WEBGL_TEXTURE_FORMATS[extension]) {
            textureFormats.add(textureFormat);
          }
        }
      }
    }
  }

  return textureFormats;
}

// DEPRECATED
/**
 * Returns a list of formats.
 * Creates a temporary WebGLRenderingContext if none is provided.
 *
 * @deprecated Pass `basis.supportedTextureFormats` to Basis loaders instead of relying on global detection.
 * @param gl - Optional context.
 */
export function detectSupportedGPUTextureFormats(gl?: WebGLRenderingContext): Set<string> {
  if (!formats) {
    formats = new Set<GPUTextureFormat>();
    const supportedTextureFormats = detectSupportedTextureFormats(gl);

    for (const gpuTextureFormat in GPU_TEXTURE_FORMATS) {
      const textureFormatsForGroup = GPU_TEXTURE_FORMATS[gpuTextureFormat as GPUTextureFormat];
      if (
        textureFormatsForGroup.some((textureFormat) => supportedTextureFormats.has(textureFormat))
      ) {
        formats.add(gpuTextureFormat as GPUTextureFormat);
      }
    }
  }

  return formats;
}

/**
 * @returns {WebGLRenderingContext?}
 */
function getWebGLContext() {
  try {
    const canvas = document.createElement('canvas');
    return canvas.getContext('webgl');
  } catch (error) {
    return null;
  }
}
