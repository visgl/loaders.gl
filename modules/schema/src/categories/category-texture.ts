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

/** One mip level */
export type TextureLevel = {
  compressed: boolean;
  format?: number;
  data: Uint8Array;
  width: number;
  height: number;
  levelSize?: number;
  hasAlpha?: boolean;
};

export type TextureOrImage = ImageType | (TextureLevel | ImageType);
