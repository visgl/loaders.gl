// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'test/utils/vitest-tape';

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

test('detectSupportedGPUTextureFormats', t => {
  if (isBrowser) {
    // Minimal test as this is WebGL dependent
    const formats = detectSupportedGPUTextureFormats();
    formats.forEach(format => t.ok(typeof format === 'string'));
    t.end();
  } else {
    const formats = detectSupportedGPUTextureFormats();
    t.equal(formats.size, 0);
    t.end();
  }
});

test('detectSupportedTextureFormats', t => {
  if (isBrowser) {
    const textureFormats = detectSupportedTextureFormats();
    textureFormats.forEach(textureFormat => t.ok(typeof textureFormat === 'string'));
    t.end();
  } else {
    const textureFormats = detectSupportedTextureFormats();
    t.equal(textureFormats.size, 0);
    t.end();
  }
});

test('selectSupportedBasisFormat', t => {
  t.deepEqual(
    selectSupportedBasisFormat(['astc-4x4-unorm']),
    'astc-4x4',
    'ASTC texture formats select ASTC format'
  );
  t.deepEqual(
    selectSupportedBasisFormat(['bc7-rgba-unorm']),
    'bc7',
    'BC7 texture formats select canonical BC7'
  );
  t.deepEqual(
    selectSupportedBasisFormat(['bc3-rgba-unorm']),
    {alpha: 'bc3', noAlpha: 'bc1'},
    'BC texture formats select BC formats'
  );
  t.deepEqual(
    selectSupportedBasisFormat(['bc5-rg-unorm']),
    {alpha: 'rgba32', noAlpha: 'rgb565'},
    'RGTC-only texture formats do not infer BC1/BC3 support'
  );
  t.equal(
    selectSupportedBasisFormat(['etc2-rgba8unorm']),
    'etc2',
    'ETC2 texture formats select ETC2 format'
  );
  t.deepEqual(
    selectSupportedBasisFormat(['etc1-rgb-unorm-webgl']),
    {alpha: 'rgba32', noAlpha: 'etc1'},
    'ETC1 extension texture formats select ETC1 format'
  );
  t.deepEqual(
    selectSupportedBasisFormat([]),
    {alpha: 'rgba32', noAlpha: 'rgb565'},
    'fallback preserves alpha'
  );
  t.end();
});

test('getSupportedBasisFormats', t => {
  const supportedBasisFormats = getSupportedBasisFormats([
    'bc3-rgba-unorm',
    'bc7-rgba-unorm',
    'etc2-rgba8unorm'
  ] as TextureFormat[]);

  t.ok(supportedBasisFormats.includes('bc3'), 'BC formats are reported');
  t.ok(supportedBasisFormats.includes('bc7'), 'BC7 formats are reported');
  t.ok(supportedBasisFormats.includes('etc2'), 'ETC2 formats are reported');
  t.ok(supportedBasisFormats.includes('rgb565'), 'fallback CPU format is always reported');
  t.end();
});

test('texture format maps are reversible for known WebGL extension formats', t => {
  t.equal(
    getTextureFormatFromWebGLFormat(GL_COMPRESSED_RGB_S3TC_DXT1_EXT),
    'bc1-rgb-unorm-webgl',
    'maps known WebGL compressed formats to canonical texture format strings'
  );
  t.equal(
    getWebGLFormatFromTextureFormat('bc1-rgb-unorm-webgl'),
    GL_COMPRESSED_RGB_S3TC_DXT1_EXT,
    'maps canonical texture format strings back to WebGL format constants'
  );
  t.end();
});
