// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TextureFormat} from '@loaders.gl/schema';
import type {
  BasisASTCBlockSize,
  BasisFormat,
  BasisFormatSelection,
  BasisSupportedTextureFeatures,
  BasisTextureInfo
} from '../../basis-types';
import {detectSupportedTextureFormats} from './detect-supported-texture-formats';

export type {
  BasisFormat,
  BasisFormatSelection,
  BasisSupportedTextureFeatures,
  BasisTextureInfo
} from '../../basis-types';

const ASTC_BLOCK_SIZES: readonly BasisASTCBlockSize[] = [
  '4x4',
  '5x4',
  '5x5',
  '6x5',
  '6x6',
  '8x5',
  '8x6',
  '8x8',
  '10x5',
  '10x6',
  '10x8',
  '10x10',
  '12x10',
  '12x12'
];

/**
 * Selects a Basis transcode format from the source and target-device capabilities.
 * When no formats are supplied, support is detected from a temporary WebGL context.
 * @param supportedTextureFormats - Texture formats supported by the target device.
 * @param source - Source texture information, when already known.
 * @param supportedTextureFeatures - Additional device capabilities such as ASTC HDR profiles.
 * @returns A Basis transcode format or alpha-dependent format selection.
 */
export function selectSupportedBasisFormat(
  supportedTextureFormats: Iterable<TextureFormat> = detectSupportedTextureFormats(),
  source?: BasisTextureInfo,
  supportedTextureFeatures: BasisSupportedTextureFeatures = {}
): BasisFormatSelection {
  const textureFormats = new Set(supportedTextureFormats);

  if (!source) {
    return selectGeneralLDRFormat(textureFormats);
  }

  if (source.isHDR) {
    const matchingASTCFormat = getMatchingASTCFormat(source);
    if (
      supportedTextureFeatures.astcHDR &&
      (matchingASTCFormat === 'astc-4x4' || matchingASTCFormat === 'astc-6x6') &&
      supportsASTC(textureFormats, matchingASTCFormat.slice(5) as BasisASTCBlockSize)
    ) {
      return matchingASTCFormat === 'astc-4x4' ? 'astc-hdr-4x4' : 'astc-hdr-6x6';
    }
    if (textureFormats.has('bc6h-rgb-ufloat')) {
      return 'bc6h';
    }
    return 'rgba16f';
  }

  if (source.codec === 'xubc7') {
    return supportsBC7(textureFormats) ? 'bc7' : 'rgba32';
  }

  if (source.codec.startsWith('xuastc-ldr-') || source.codec.startsWith('astc-ldr-')) {
    const matchingASTCFormat = getMatchingASTCFormat(source);
    if (
      matchingASTCFormat &&
      supportsASTC(textureFormats, matchingASTCFormat.slice(5) as BasisASTCBlockSize)
    ) {
      return matchingASTCFormat;
    }
    return selectLDRFallback(textureFormats, source, ['bc7', 'bc', 'etc2', 'atc']);
  }

  if (source.codec === 'uastc-ldr-4x4') {
    if (supportsASTC(textureFormats, '4x4')) {
      return 'astc-4x4';
    }
    return selectLDRFallback(textureFormats, source, ['bc7', 'bc', 'etc2', 'etc1', 'pvrtc', 'atc']);
  }

  return selectLDRFallback(textureFormats, source, ['etc2', 'etc1', 'bc7', 'bc', 'pvrtc', 'atc']);
}

/**
 * Lists Basis transcode formats available for the supplied target-device texture formats.
 * @param supportedTextureFormats - Texture formats supported by the target device.
 * @param supportedTextureFeatures - Additional target-device capabilities.
 * @returns Supported Basis transcode formats, including portable uncompressed fallbacks.
 */
export function getSupportedBasisFormats(
  supportedTextureFormats: Iterable<TextureFormat> = detectSupportedTextureFormats(),
  supportedTextureFeatures: BasisSupportedTextureFeatures = {}
): BasisFormat[] {
  const textureFormats = new Set(supportedTextureFormats);
  const basisFormats: BasisFormat[] = [];

  for (const blockSize of ASTC_BLOCK_SIZES) {
    if (supportsASTC(textureFormats, blockSize)) {
      basisFormats.push(`astc-${blockSize}`);
    }
  }
  if (supportsBC(textureFormats)) {
    basisFormats.push('bc1', 'bc3');
  }
  if (hasAny(textureFormats, ['bc4-r-unorm', 'bc4-r-snorm'])) {
    basisFormats.push('bc4');
  }
  if (hasAny(textureFormats, ['bc5-rg-unorm', 'bc5-rg-snorm'])) {
    basisFormats.push('bc5');
  }
  if (supportsBC7(textureFormats)) {
    basisFormats.push('bc7');
  }
  if (textureFormats.has('bc6h-rgb-ufloat')) {
    basisFormats.push('bc6h');
  }
  if (supportsPVRTC(textureFormats)) {
    basisFormats.push('pvrtc1-4-rgb', 'pvrtc1-4-rgba');
  }
  if (supportsETC2(textureFormats)) {
    basisFormats.push('etc2');
  }
  if (textureFormats.has('eac-r11unorm')) {
    basisFormats.push('eac-r11');
  }
  if (textureFormats.has('eac-rg11unorm')) {
    basisFormats.push('eac-rg11');
  }
  if (textureFormats.has('etc1-rgb-unorm-webgl')) {
    basisFormats.push('etc1');
  }
  if (supportsATC(textureFormats)) {
    basisFormats.push('atc-rgb', 'atc-rgba-interpolated-alpha');
  }
  if (supportedTextureFeatures.astcHDR) {
    if (supportsASTC(textureFormats, '4x4')) {
      basisFormats.push('astc-hdr-4x4');
    }
    if (supportsASTC(textureFormats, '6x6')) {
      basisFormats.push('astc-hdr-6x6');
    }
  }

  basisFormats.push('rgba32', 'rgb565', 'bgr565', 'rgba4444', 'rgba16f', 'rgb9e5');
  return basisFormats;
}

function selectGeneralLDRFormat(textureFormats: Set<TextureFormat>): BasisFormatSelection {
  if (supportsASTC(textureFormats, '4x4')) {
    return 'astc-4x4';
  }
  if (supportsBC7(textureFormats)) {
    return 'bc7';
  }
  if (supportsBC(textureFormats)) {
    return {alpha: 'bc3', noAlpha: 'bc1'};
  }
  if (supportsETC2(textureFormats)) {
    return 'etc2';
  }
  if (textureFormats.has('etc1-rgb-unorm-webgl')) {
    return {alpha: 'rgba32', noAlpha: 'etc1'};
  }
  if (supportsPVRTC(textureFormats)) {
    return {alpha: 'pvrtc1-4-rgba', noAlpha: 'pvrtc1-4-rgb'};
  }
  if (supportsATC(textureFormats)) {
    return {alpha: 'atc-rgba-interpolated-alpha', noAlpha: 'atc-rgb'};
  }
  return {alpha: 'rgba32', noAlpha: 'rgb565'};
}

type LDRFormatFamily = 'bc7' | 'bc' | 'etc2' | 'etc1' | 'pvrtc' | 'atc';

function selectLDRFallback(
  textureFormats: Set<TextureFormat>,
  source: BasisTextureInfo,
  priorities: LDRFormatFamily[]
): BasisFormat {
  for (const priority of priorities) {
    switch (priority) {
      case 'bc7':
        if (supportsBC7(textureFormats)) {
          return 'bc7';
        }
        break;
      case 'bc':
        if (supportsBC(textureFormats)) {
          return source.hasAlpha ? 'bc3' : 'bc1';
        }
        break;
      case 'etc2':
        if (supportsETC2(textureFormats)) {
          return 'etc2';
        }
        break;
      case 'etc1':
        if (!source.hasAlpha && textureFormats.has('etc1-rgb-unorm-webgl')) {
          return 'etc1';
        }
        break;
      case 'pvrtc':
        if (supportsPVRTC(textureFormats)) {
          return source.hasAlpha ? 'pvrtc1-4-rgba' : 'pvrtc1-4-rgb';
        }
        break;
      case 'atc':
        if (supportsATC(textureFormats)) {
          return source.hasAlpha ? 'atc-rgba-interpolated-alpha' : 'atc-rgb';
        }
        break;
      default:
        break;
    }
  }
  return source.hasAlpha ? 'rgba32' : 'rgb565';
}

function getMatchingASTCFormat(source: BasisTextureInfo): `astc-${BasisASTCBlockSize}` | null {
  const blockSize = `${source.blockWidth}x${source.blockHeight}` as BasisASTCBlockSize;
  return ASTC_BLOCK_SIZES.includes(blockSize) ? `astc-${blockSize}` : null;
}

function supportsASTC(textureFormats: Set<TextureFormat>, blockSize: BasisASTCBlockSize): boolean {
  return hasAny(textureFormats, [`astc-${blockSize}-unorm`, `astc-${blockSize}-unorm-srgb`]);
}

function supportsBC7(textureFormats: Set<TextureFormat>): boolean {
  return hasAny(textureFormats, ['bc7-rgba-unorm', 'bc7-rgba-unorm-srgb']);
}

function supportsBC(textureFormats: Set<TextureFormat>): boolean {
  return hasAny(textureFormats, [
    'bc1-rgb-unorm-webgl',
    'bc1-rgb-unorm-srgb-webgl',
    'bc1-rgba-unorm',
    'bc1-rgba-unorm-srgb',
    'bc3-rgba-unorm',
    'bc3-rgba-unorm-srgb'
  ]);
}

function supportsETC2(textureFormats: Set<TextureFormat>): boolean {
  return hasAny(textureFormats, [
    'etc2-rgb8unorm',
    'etc2-rgb8unorm-srgb',
    'etc2-rgba8unorm',
    'etc2-rgba8unorm-srgb'
  ]);
}

function supportsPVRTC(textureFormats: Set<TextureFormat>): boolean {
  return hasAny(textureFormats, [
    'pvrtc-rgb4unorm-webgl',
    'pvrtc-rgba4unorm-webgl',
    'pvrtc-rgb2unorm-webgl',
    'pvrtc-rgba2unorm-webgl'
  ]);
}

function supportsATC(textureFormats: Set<TextureFormat>): boolean {
  return hasAny(textureFormats, [
    'atc-rgb-unorm-webgl',
    'atc-rgba-unorm-webgl',
    'atc-rgbai-unorm-webgl'
  ]);
}

function hasAny(textureFormats: Set<TextureFormat>, candidates: TextureFormat[]): boolean {
  return candidates.some(candidate => textureFormats.has(candidate));
}
