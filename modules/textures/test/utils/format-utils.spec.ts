// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import type {TextureFormat} from '@loaders.gl/schema';
import {isBrowser} from '@loaders.gl/core';
import {
  getSupportedBasisFormats,
  selectSupportedBasisFormat
} from '../../src/lib/utils/basis-format-utils';
import {
  detectSupportedGPUTextureFormats,
  detectSupportedTextureFormats
} from '../../src/lib/utils/detect-supported-texture-formats';
import {
  getTextureFormatFromWebGLFormat,
  getWebGLFormatFromTextureFormat
} from '../../src/lib/utils/texture-format-map';
import {GL_COMPRESSED_RGB_S3TC_DXT1_EXT} from '../../src/lib/gl-extensions';
test('detectSupportedGPUTextureFormats', () => {
  if (isBrowser) {
    // Minimal test as this is WebGL dependent
    const formats = detectSupportedGPUTextureFormats();
    formats.forEach(format => expect(typeof format === 'string').toBeTruthy());
  } else {
    const formats = detectSupportedGPUTextureFormats();
    expect(formats.size).toBe(0);
  }
});
test('detectSupportedTextureFormats', () => {
  if (isBrowser) {
    const textureFormats = detectSupportedTextureFormats();
    textureFormats.forEach(textureFormat => expect(typeof textureFormat === 'string').toBeTruthy());
  } else {
    const textureFormats = detectSupportedTextureFormats();
    expect(textureFormats.size).toBe(0);
  }
});
test('selectSupportedBasisFormat', () => {
  expect(
    selectSupportedBasisFormat(['astc-4x4-unorm']),
    'ASTC texture formats select ASTC format'
  ).toEqual('astc-4x4');
  expect(
    selectSupportedBasisFormat(['bc7-rgba-unorm']),
    'BC7 texture formats select canonical BC7'
  ).toEqual('bc7');
  expect(
    selectSupportedBasisFormat(['bc3-rgba-unorm']),
    'BC texture formats select BC formats'
  ).toEqual({alpha: 'bc3', noAlpha: 'bc1'});
  expect(
    selectSupportedBasisFormat(['bc5-rg-unorm']),
    'RGTC-only texture formats do not infer BC1/BC3 support'
  ).toEqual({alpha: 'rgba32', noAlpha: 'rgb565'});
  expect(
    selectSupportedBasisFormat(['etc2-rgba8unorm']),
    'ETC2 texture formats select ETC2 format'
  ).toBe('etc2');
  expect(
    selectSupportedBasisFormat(['etc1-rgb-unorm-webgl']),
    'ETC1 extension texture formats select ETC1 format'
  ).toEqual({alpha: 'rgba32', noAlpha: 'etc1'});
  expect(selectSupportedBasisFormat([]), 'fallback preserves alpha').toEqual({
    alpha: 'rgba32',
    noAlpha: 'rgb565'
  });
});
test('getSupportedBasisFormats', () => {
  const supportedBasisFormats = getSupportedBasisFormats([
    'bc3-rgba-unorm',
    'bc7-rgba-unorm',
    'etc2-rgba8unorm'
  ] as TextureFormat[]);
  expect(supportedBasisFormats.includes('bc3'), 'BC formats are reported').toBeTruthy();
  expect(supportedBasisFormats.includes('bc7'), 'BC7 formats are reported').toBeTruthy();
  expect(supportedBasisFormats.includes('etc2'), 'ETC2 formats are reported').toBeTruthy();
  expect(
    supportedBasisFormats.includes('rgb565'),
    'fallback CPU format is always reported'
  ).toBeTruthy();
});
test('texture format maps are reversible for known WebGL extension formats', () => {
  expect(
    getTextureFormatFromWebGLFormat(GL_COMPRESSED_RGB_S3TC_DXT1_EXT),
    'maps known WebGL compressed formats to canonical texture format strings'
  ).toBe('bc1-rgb-unorm-webgl');
  expect(
    getWebGLFormatFromTextureFormat('bc1-rgb-unorm-webgl'),
    'maps canonical texture format strings back to WebGL format constants'
  ).toBe(GL_COMPRESSED_RGB_S3TC_DXT1_EXT);
});
