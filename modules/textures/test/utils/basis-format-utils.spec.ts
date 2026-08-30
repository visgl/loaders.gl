// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import type {BasisTextureInfo} from '../../src/basis-types';
import {
  getSupportedBasisFormats,
  selectSupportedBasisFormat
} from '../../src/lib/utils/basis-format-utils';

const ETC1S_OPAQUE: BasisTextureInfo = {
  codec: 'etc1s',
  isHDR: false,
  isSRGB: false,
  hasAlpha: false,
  blockWidth: 4,
  blockHeight: 4
};

describe('source-aware Basis format selection', () => {
  test('uses input-specific LDR priorities', () => {
    expect(selectSupportedBasisFormat(['etc2-rgba8unorm', 'bc7-rgba-unorm'], ETC1S_OPAQUE)).toBe(
      'etc2'
    );
    expect(
      selectSupportedBasisFormat(['astc-6x6-unorm', 'bc7-rgba-unorm'], {
        ...ETC1S_OPAQUE,
        codec: 'xuastc-ldr-6x6',
        blockWidth: 6,
        blockHeight: 6
      })
    ).toBe('astc-6x6');
    expect(
      selectSupportedBasisFormat(['astc-4x4-unorm', 'bc7-rgba-unorm'], {
        ...ETC1S_OPAQUE,
        codec: 'xubc7'
      })
    ).toBe('bc7');
  });

  test('uses alpha-safe portable fallbacks', () => {
    expect(selectSupportedBasisFormat([], ETC1S_OPAQUE)).toBe('rgb565');
    expect(selectSupportedBasisFormat([], {...ETC1S_OPAQUE, hasAlpha: true})).toBe('rgba32');
  });

  test('requires explicit ASTC HDR profile support', () => {
    const hdrSource: BasisTextureInfo = {
      ...ETC1S_OPAQUE,
      codec: 'uastc-hdr-4x4',
      isHDR: true
    };
    expect(selectSupportedBasisFormat(['astc-4x4-unorm'], hdrSource)).toBe('rgba16f');
    expect(selectSupportedBasisFormat(['astc-4x4-unorm'], hdrSource, {astcHDR: true})).toBe(
      'astc-hdr-4x4'
    );
    expect(selectSupportedBasisFormat(['bc6h-rgb-ufloat'], hdrSource)).toBe('bc6h');
  });

  test('enumerates every compressed family and optional ASTC HDR profile', () => {
    const formats = getSupportedBasisFormats(
      [
        'astc-4x4-unorm',
        'astc-6x6-unorm-srgb',
        'bc1-rgb-unorm-webgl',
        'bc4-r-snorm',
        'bc5-rg-unorm',
        'bc7-rgba-unorm-srgb',
        'bc6h-rgb-ufloat',
        'pvrtc-rgba4unorm-webgl',
        'etc2-rgb8unorm-srgb',
        'eac-r11unorm',
        'eac-rg11unorm',
        'etc1-rgb-unorm-webgl',
        'atc-rgbai-unorm-webgl'
      ],
      {astcHDR: true}
    );

    expect(formats).toEqual(
      expect.arrayContaining([
        'astc-4x4',
        'astc-6x6',
        'astc-hdr-4x4',
        'astc-hdr-6x6',
        'bc1',
        'bc3',
        'bc4',
        'bc5',
        'bc7',
        'bc6h',
        'pvrtc1-4-rgb',
        'pvrtc1-4-rgba',
        'etc2',
        'eac-r11',
        'eac-rg11',
        'etc1',
        'atc-rgb',
        'atc-rgba-interpolated-alpha',
        'rgba16f',
        'rgb9e5'
      ])
    );
  });

  test('selects alpha-aware fallbacks across every LDR family', () => {
    const alphaSource = {...ETC1S_OPAQUE, hasAlpha: true};
    expect(selectSupportedBasisFormat(['bc3-rgba-unorm'], alphaSource)).toBe('bc3');
    expect(selectSupportedBasisFormat(['etc1-rgb-unorm-webgl'], ETC1S_OPAQUE)).toBe('etc1');
    expect(selectSupportedBasisFormat(['etc1-rgb-unorm-webgl'], alphaSource)).toBe('rgba32');
    expect(selectSupportedBasisFormat(['pvrtc-rgb4unorm-webgl'], alphaSource)).toBe(
      'pvrtc1-4-rgba'
    );
    expect(selectSupportedBasisFormat(['atc-rgb-unorm-webgl'], ETC1S_OPAQUE)).toBe('atc-rgb');
    expect(selectSupportedBasisFormat(['atc-rgba-unorm-webgl'], alphaSource)).toBe(
      'atc-rgba-interpolated-alpha'
    );
    expect(selectSupportedBasisFormat(['pvrtc-rgb2unorm-webgl'])).toEqual({
      alpha: 'pvrtc1-4-rgba',
      noAlpha: 'pvrtc1-4-rgb'
    });
    expect(selectSupportedBasisFormat(['atc-rgbai-unorm-webgl'])).toEqual({
      alpha: 'atc-rgba-interpolated-alpha',
      noAlpha: 'atc-rgb'
    });
  });

  test('handles source-matched ASTC blocks and unsupported block sizes', () => {
    const astcSource = {
      ...ETC1S_OPAQUE,
      codec: 'astc-ldr-8x8' as const,
      blockWidth: 8,
      blockHeight: 8
    };
    expect(selectSupportedBasisFormat(['astc-8x8-unorm'], astcSource)).toBe('astc-8x8');
    expect(
      selectSupportedBasisFormat(['bc7-rgba-unorm'], {
        ...astcSource,
        blockWidth: 7,
        blockHeight: 7
      })
    ).toBe('bc7');
    expect(
      selectSupportedBasisFormat(['astc-4x4-unorm'], {
        ...ETC1S_OPAQUE,
        codec: 'uastc-ldr-4x4'
      })
    ).toBe('astc-4x4');
  });
});
