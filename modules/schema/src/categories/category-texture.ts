// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ImageType} from './category-image';
import type {TypedArray} from '../types/types';

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
  | 'pvrtc-rgb2unorm-webgl'
  | 'pvrtc-rgba2unorm-webgl'
  | 'etc1-rgb-unorm-webgl'
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

/** Application-facing metadata attached to texture payloads. */
export type TextureMetadata = Record<string, unknown>;

/** Return type of `texture` category loaders. */
export type Texture<MetadataT extends TextureMetadata = TextureMetadata> =
  | Texture1D<MetadataT>
  | Texture2D<MetadataT>
  | Texture3D<MetadataT>
  | TextureCube<MetadataT>
  | Texture2DArray<MetadataT>
  | TextureCubeArray<MetadataT>;

/** One-dimensional texture with mip levels. */
export type Texture1D<MetadataT extends TextureMetadata = TextureMetadata> = {
  /** loaders.gl shape tag identifying texture payloads. */
  shape: 'texture';
  /** Application-facing format metadata, when provided by the loader. */
  metadata?: MetadataT;
  /** Texture dimensionality. */
  type: '1d';
  /** Canonical loaders.gl texture format for the texture payload. */
  format: TextureFormat;
  /** Mip levels that make up the texture. */
  data: TextureLevel[];
};

/** Two-dimensional texture with mip levels. */
export type Texture2D<MetadataT extends TextureMetadata = TextureMetadata> = {
  /** loaders.gl shape tag identifying texture payloads. */
  shape: 'texture';
  /** Application-facing format metadata, when provided by the loader. */
  metadata?: MetadataT;
  /** Texture dimensionality. */
  type: '2d';
  /** Canonical loaders.gl texture format for the texture payload. */
  format: TextureFormat;
  /** Mip levels that make up the texture. */
  data: TextureLevel[];
};

/** Three-dimensional texture with mip levels for each depth slice. */
export type Texture3D<MetadataT extends TextureMetadata = TextureMetadata> = {
  /** loaders.gl shape tag identifying texture payloads. */
  shape: 'texture';
  /** Application-facing format metadata, when provided by the loader. */
  metadata?: MetadataT;
  /** Texture dimensionality. */
  type: '3d';
  /** Canonical loaders.gl texture format for the texture payload. */
  format: TextureFormat;
  /** Mip levels grouped by depth slice. */
  data: TextureLevel[][];
};

/** Cube texture with mip levels for each face. */
export type TextureCube<MetadataT extends TextureMetadata = TextureMetadata> = {
  /** loaders.gl shape tag identifying texture payloads. */
  shape: 'texture';
  /** Application-facing format metadata, when provided by the loader. */
  metadata?: MetadataT;
  /** Texture dimensionality. */
  type: 'cube';
  /** Canonical loaders.gl texture format for the texture payload. */
  format: TextureFormat;
  /** Mip levels grouped by cube face. */
  data: TextureLevel[][];
};

/** Array of two-dimensional textures with mip levels for each layer. */
export type Texture2DArray<MetadataT extends TextureMetadata = TextureMetadata> = {
  /** loaders.gl shape tag identifying texture payloads. */
  shape: 'texture';
  /** Application-facing format metadata, when provided by the loader. */
  metadata?: MetadataT;
  /** Texture dimensionality. */
  type: '2d-array';
  /** Canonical loaders.gl texture format for the texture payload. */
  format: TextureFormat;
  /** Mip levels grouped by array layer. */
  data: TextureLevel[][];
};

/** Array of cube textures with mip levels for each face in each layer. */
export type TextureCubeArray<MetadataT extends TextureMetadata = TextureMetadata> = {
  /** loaders.gl shape tag identifying texture payloads. */
  shape: 'texture';
  /** Application-facing format metadata, when provided by the loader. */
  metadata?: MetadataT;
  /** Texture dimensionality. */
  type: 'cube-array';
  /** Canonical loaders.gl texture format for the texture payload. */
  format: TextureFormat;
  /** Mip levels grouped by cube-array layer and face. */
  data: TextureLevel[][][];
};

/** A TextureLevel holds data for one texture mip level */
export type TextureLevel = {
  /** loaders.gl shape tag identifying texture level payloads */
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
  /** Optional bitmap handle for image-backed texture levels */
  imageBitmap?: ImageBitmap;
  /** Byte array or float pixel data. Will be a dummy length 0 array if imageBitmap is provided */
  data: TypedArray;
  levelSize?: number;
  hasAlpha?: boolean;
};

export type TextureOrImage = ImageType | (TextureLevel | ImageType);
