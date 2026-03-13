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
  | 'rgb8unorm-webgl'
  | 'rgba8unorm'
  | 'rgba8unorm-srgb'
  | 'r8snorm'
  | 'rg8snorm'
  | 'rgb8snorm-webgl'
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
  | 'rgb16unorm-webgl'
  | 'rgba16unorm'
  | 'r16snorm'
  | 'rg16snorm'
  | 'rgb16snorm-webgl'
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
  | 'rgb32float-webgl'
  | 'rgba32float'
  | 'rgba4unorm-webgl'
  | 'rgb565unorm-webgl'
  | 'rgb5a1unorm-webgl'
  | 'rgb9e5ufloat'
  | 'rg11b10ufloat'
  | 'rgb10a2unorm'
  | 'rgb10a2uint';

export type TextureFormatCompressed =
  | 'bc1-rgb-unorm-webgl'
  | 'bc1-rgb-unorm-srgb-webgl'
  | 'pvrtc-rgb4unorm-webgl'
  | 'pvrtc-rgba4unorm-webgl'
  | 'pvrtc-rbg2unorm-webgl'
  | 'pvrtc-rgba2unorm-webgl'
  | 'etc1-rbg-unorm-webgl'
  | 'atc-rgb-unorm-webgl'
  | 'atc-rgba-unorm-webgl'
  | 'atc-rgbai-unorm-webgl'
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

export type GLTextureFormat =
  | 0x1907
  | 0x1908
  | 0x8056
  | 0x8057
  | 0x8058
  | 0x8d62
  | 0x83f0
  | 0x83f1
  | 0x83f2
  | 0x83f3
  | 0x9270
  | 0x9271
  | 0x9272
  | 0x9273
  | 0x9274
  | 0x9275
  | 0x9276
  | 0x9277
  | 0x9278
  | 0x9279
  | 0x8c00
  | 0x8c01
  | 0x8c02
  | 0x8c03
  | 0x8d64
  | 0x8c92
  | 0x8c93
  | 0x87ee
  | 0x8dbb
  | 0x8dbc
  | 0x8dbd
  | 0x8dbe
  | 0x8e8c
  | 0x8e8d
  | 0x8e8e
  | 0x8e8f
  | 0x8c4c
  | 0x8c4d
  | 0x8c4e
  | 0x8c4f
  | 0x93b0
  | 0x93b1
  | 0x93b2
  | 0x93b3
  | 0x93b4
  | 0x93b5
  | 0x93b6
  | 0x93b7
  | 0x93b8
  | 0x93b9
  | 0x93ba
  | 0x93bb
  | 0x93bc
  | 0x93bd
  | 0x93d0
  | 0x93d1
  | 0x93d2
  | 0x93d3
  | 0x93d4
  | 0x93d5
  | 0x93d6
  | 0x93d7
  | 0x93d8
  | 0x93d9
  | 0x93da
  | 0x93db
  | 0x93dc
  | 0x93dd;

/** A TextureLevel holds data for one texture mip level */
export type TextureLevel = {
  /** Shape tag identifying texture level payloads */
  shape: 'texture-level';
  /** WebGPU texture format corresponding the format of the data in this TextureLevel */
  textureFormat?: TextureFormat;
  /** WebGL texture format constant corresponding the format of the data in this TextureLevel */
  format?: GLTextureFormat;
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
