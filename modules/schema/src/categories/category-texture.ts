// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ImageType} from './category-image';

/**
 * These represent the main compressed texture formats
 * Each format typically has a number of more specific subformats
 */
export type GPUTextureFormat =
  | 'dxt'
  | 'dxt-srgb'
  | 'etc1'
  | 'etc2'
  | 'pvrtc'
  | 'atc'
  | 'astc'
  | 'rgtc';

export type TextureFormat = TextureFormatColorUncompressed | TextureFormatCompressed;

export type TextureFormatColorUncompressed =
  | 'r8unorm'
  | 'rg8unorm'
  | 'rgb8unorm-ext'
  | 'rgba8unorm'
  | 'rgba8unorm-srgb'
  | 'r8snorm'
  | 'rg8snorm'
  | 'rgb8snorm-ext'
  | 'rgba8snorm'
  | 'r8uint'
  | 'rg8uint'
  | 'rgba8uint'
  | 'r8sint'
  | 'rg8sint'
  | 'rgba8sint'
  | 'bgra8unorm'
  | 'bgra8unorm-srgb'
  | 'r16unorm'
  | 'rg16unorm'
  | 'rgb16unorm-ext'
  | 'rgba16unorm'
  | 'r16snorm'
  | 'rg16snorm'
  | 'rgb16snorm-ext'
  | 'rgba16snorm'
  | 'r16uint'
  | 'rg16uint'
  | 'rgba16uint'
  | 'r16sint'
  | 'rg16sint'
  | 'rgba16sint'
  | 'r16float'
  | 'rg16float'
  | 'rgba16float'
  | 'r32uint'
  | 'rg32uint'
  | 'rgba32uint'
  | 'r32sint'
  | 'rg32sint'
  | 'rgba32sint'
  | 'r32float'
  | 'rg32float'
  | 'rgb32float-ext'
  | 'rgba32float'
  | 'rgba4unorm-ext'
  | 'rgb565unorm-ext'
  | 'rgb5a1unorm-ext'
  | 'rgb9e5ufloat'
  | 'rg11b10ufloat'
  | 'rgb10a2unorm'
  | 'rgb10a2uint';

export type TextureFormatCompressed =
  | 'bc1-rgb-unorm-ext'
  | 'bc1-rgb-unorm-srgb-ext'
  | 'pvrtc-rgb4unorm-ext'
  | 'pvrtc-rgba4unorm-ext'
  | 'pvrtc-rgb2unorm-ext'
  | 'pvrtc-rgba2unorm-ext'
  | 'etc1-rbg-unorm-ext'
  | 'atc-rgb-unorm-ext'
  | 'atc-rgba-unorm-ext'
  | 'atc-rgbai-unorm-ext'
  | 'bc1-rgba-unorm'
  | 'bc1-rgba-unorm-srgb'
  | 'bc2-rgba-unorm'
  | 'bc2-rgba-unorm-srgb'
  | 'bc3-rgba-unorm'
  | 'bc3-rgba-unorm-srgb'
  | 'bc4-r-unorm'
  | 'bc4-r-snorm'
  | 'bc5-rg-unorm'
  | 'bc5-rg-snorm'
  | 'bc6h-rgb-ufloat'
  | 'bc6h-rgb-float'
  | 'bc7-rgba-unorm'
  | 'bc7-rgba-unorm-srgb'
  | 'etc2-rgb8unorm'
  | 'etc2-rgb8unorm-srgb'
  | 'etc2-rgb8a1unorm'
  | 'etc2-rgb8a1unorm-srgb'
  | 'etc2-rgba8unorm'
  | 'etc2-rgba8unorm-srgb'
  | 'eac-r11unorm'
  | 'eac-r11snorm'
  | 'eac-rg11unorm'
  | 'eac-rg11snorm'
  | 'astc-4x4-unorm'
  | 'astc-4x4-unorm-srgb'
  | 'astc-5x4-unorm'
  | 'astc-5x4-unorm-srgb'
  | 'astc-5x5-unorm'
  | 'astc-5x5-unorm-srgb'
  | 'astc-6x5-unorm'
  | 'astc-6x5-unorm-srgb'
  | 'astc-6x6-unorm'
  | 'astc-6x6-unorm-srgb'
  | 'astc-8x5-unorm'
  | 'astc-8x5-unorm-srgb'
  | 'astc-8x6-unorm'
  | 'astc-8x6-unorm-srgb'
  | 'astc-8x8-unorm'
  | 'astc-8x8-unorm-srgb'
  | 'astc-10x5-unorm'
  | 'astc-10x5-unorm-srgb'
  | 'astc-10x6-unorm'
  | 'astc-10x6-unorm-srgb'
  | 'astc-10x8-unorm'
  | 'astc-10x8-unorm-srgb'
  | 'astc-10x10-unorm'
  | 'astc-10x10-unorm-srgb'
  | 'astc-12x10-unorm'
  | 'astc-12x10-unorm-srgb'
  | 'astc-12x12-unorm'
  | 'astc-12x12-unorm-srgb';

/** A TextureLevel holds data for one texture mip level */
export type TextureLevel = {
  /** Shape tag identifying texture level payloads */
  shape: 'texture-level';
  /** WebGPU texture format corresponding the format of the data in this TextureLevel */
  textureFormat?: TextureFormat;
  /** Numeric API-specific format constant, currently used for WebGL/OpenGL upload paths */
  format?: number;
  /** Whether the texture is compressed */
  compressed: boolean;
  /** Width in texels */
  width: number;
  /** Height in texels */
  height: number;
  /** Byte array */
  data: Uint8Array;
  levelSize?: number;
  hasAlpha?: boolean;
};

export type TextureOrImage = ImageType | (TextureLevel | ImageType);
