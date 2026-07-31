// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TextureFormat} from '@loaders.gl/schema';
import {detectSupportedTextureFormats} from './detect-supported-texture-formats';

/** Transcode formats supported by Basis Universal. */
export type BasisFormat =
  | 'etc1'
  | 'etc2'
  | 'bc1'
  | 'bc3'
  | 'bc4'
  | 'bc5'
  | 'bc7-m6-opaque-only'
  | 'bc7-m5'
  | 'pvrtc1-4-rgb'
  | 'pvrtc1-4-rgba'
  | 'astc-4x4'
  | 'atc-rgb'
  | 'atc-rgba-interpolated-alpha'
  | 'rgba32'
  | 'rgb565'
  | 'bgr565'
  | 'rgba4444';

/** Basis format selection that can vary based on whether the source has an alpha channel. */
export type BasisFormatSelection =
  | BasisFormat
  | {
      alpha: BasisFormat;
      noAlpha: BasisFormat;
    };

/**
 * Selects a Basis transcode format from the texture formats supported by the target device.
 * When no formats are supplied, support is detected from a temporary WebGL context.
 * @param supportedTextureFormats - Texture formats supported by the target device.
 * @returns A Basis transcode format or alpha-dependent format selection.
 */
export function selectSupportedBasisFormat(
  supportedTextureFormats: Iterable<TextureFormat> = detectSupportedTextureFormats()
): BasisFormatSelection {
  const textureFormats = new Set(supportedTextureFormats);

  if (hasSupportedTextureFormat(textureFormats, ['astc-4x4-unorm', 'astc-4x4-unorm-srgb'])) {
    return 'astc-4x4';
  } else if (hasSupportedTextureFormat(textureFormats, ['bc7-rgba-unorm', 'bc7-rgba-unorm-srgb'])) {
    return {
      alpha: 'bc7-m5',
      noAlpha: 'bc7-m6-opaque-only'
    };
  } else if (
    hasSupportedTextureFormat(textureFormats, [
      'bc1-rgb-unorm-webgl',
      'bc1-rgb-unorm-srgb-webgl',
      'bc1-rgba-unorm',
      'bc1-rgba-unorm-srgb',
      'bc2-rgba-unorm',
      'bc2-rgba-unorm-srgb',
      'bc3-rgba-unorm',
      'bc3-rgba-unorm-srgb'
    ])
  ) {
    return {
      alpha: 'bc3',
      noAlpha: 'bc1'
    };
  } else if (
    hasSupportedTextureFormat(textureFormats, [
      'pvrtc-rgb4unorm-webgl',
      'pvrtc-rgba4unorm-webgl',
      'pvrtc-rgb2unorm-webgl',
      'pvrtc-rgba2unorm-webgl'
    ])
  ) {
    return {
      alpha: 'pvrtc1-4-rgba',
      noAlpha: 'pvrtc1-4-rgb'
    };
  } else if (
    hasSupportedTextureFormat(textureFormats, [
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
    ])
  ) {
    return 'etc2';
  } else if (textureFormats.has('etc1-rgb-unorm-webgl')) {
    return 'etc1';
  } else if (
    hasSupportedTextureFormat(textureFormats, [
      'atc-rgb-unorm-webgl',
      'atc-rgba-unorm-webgl',
      'atc-rgbai-unorm-webgl'
    ])
  ) {
    return {
      alpha: 'atc-rgba-interpolated-alpha',
      noAlpha: 'atc-rgb'
    };
  }
  return 'rgb565';
}

/**
 * Lists the Basis transcode formats available for the texture formats supported by a target device.
 * @param supportedTextureFormats - Texture formats supported by the target device.
 * @returns Supported Basis transcode formats, including uncompressed fallback formats.
 */
export function getSupportedBasisFormats(
  supportedTextureFormats: Iterable<TextureFormat> = detectSupportedTextureFormats()
): BasisFormat[] {
  const textureFormats = new Set(supportedTextureFormats);
  const basisFormats: BasisFormat[] = [];

  if (hasSupportedTextureFormat(textureFormats, ['astc-4x4-unorm', 'astc-4x4-unorm-srgb'])) {
    basisFormats.push('astc-4x4');
  }
  if (
    hasSupportedTextureFormat(textureFormats, [
      'bc1-rgb-unorm-webgl',
      'bc1-rgb-unorm-srgb-webgl',
      'bc1-rgba-unorm',
      'bc1-rgba-unorm-srgb',
      'bc2-rgba-unorm',
      'bc2-rgba-unorm-srgb',
      'bc3-rgba-unorm',
      'bc3-rgba-unorm-srgb'
    ])
  ) {
    basisFormats.push('bc1', 'bc3');
  }
  if (hasSupportedTextureFormat(textureFormats, ['bc4-r-unorm', 'bc4-r-snorm'])) {
    basisFormats.push('bc4');
  }
  if (hasSupportedTextureFormat(textureFormats, ['bc5-rg-unorm', 'bc5-rg-snorm'])) {
    basisFormats.push('bc5');
  }
  if (hasSupportedTextureFormat(textureFormats, ['bc7-rgba-unorm', 'bc7-rgba-unorm-srgb'])) {
    basisFormats.push('bc7-m5', 'bc7-m6-opaque-only');
  }
  if (
    hasSupportedTextureFormat(textureFormats, [
      'pvrtc-rgb4unorm-webgl',
      'pvrtc-rgba4unorm-webgl',
      'pvrtc-rgb2unorm-webgl',
      'pvrtc-rgba2unorm-webgl'
    ])
  ) {
    basisFormats.push('pvrtc1-4-rgb', 'pvrtc1-4-rgba');
  }
  if (
    hasSupportedTextureFormat(textureFormats, [
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
    ])
  ) {
    basisFormats.push('etc2');
  }
  if (textureFormats.has('etc1-rgb-unorm-webgl')) {
    basisFormats.push('etc1');
  }
  if (
    hasSupportedTextureFormat(textureFormats, [
      'atc-rgb-unorm-webgl',
      'atc-rgba-unorm-webgl',
      'atc-rgbai-unorm-webgl'
    ])
  ) {
    basisFormats.push('atc-rgb', 'atc-rgba-interpolated-alpha');
  }

  basisFormats.push('rgba32', 'rgb565', 'bgr565', 'rgba4444');
  return basisFormats;
}

/**
 * Checks whether any candidate texture format is supported.
 * @param supportedTextureFormats - Texture formats supported by the target device.
 * @param candidateTextureFormats - Candidate formats to check.
 * @returns `true` when at least one candidate is supported.
 */
function hasSupportedTextureFormat(
  supportedTextureFormats: Set<TextureFormat>,
  candidateTextureFormats: TextureFormat[]
): boolean {
  return candidateTextureFormats.some(textureFormat => supportedTextureFormats.has(textureFormat));
}
