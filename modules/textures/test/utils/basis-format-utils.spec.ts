// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import type {BasisTextureInfo} from '../../src/basis-types';
import {selectSupportedBasisFormat} from '../../src/lib/utils/basis-format-utils';

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
});
