// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';

import type {TextureFormat} from '@loaders.gl/schema';
import {isBrowser} from '@loaders.gl/core';
import {
  getSupportedBasisFormats,
  selectSupportedBasisFormat
} from '../../src/lib/parsers/parse-basis';
import {
  detectSupportedGPUTextureFormats,
  detectSupportedTextureFormats
} from '../../src/lib/utils/detect-supported-texture-formats';

test('detectSupportedGPUTextureFormats', (t) => {
  if (isBrowser) {
    // Minimal test as this is WebGL dependent
    const formats = detectSupportedGPUTextureFormats();
    formats.forEach((format) => t.ok(typeof format === 'string'));
    t.end();
  } else {
    const formats = detectSupportedGPUTextureFormats();
    t.equal(formats.size, 0);
    t.end();
  }
});

test('detectSupportedTextureFormats', (t) => {
  if (isBrowser) {
    const textureFormats = detectSupportedTextureFormats();
    textureFormats.forEach((textureFormat) => t.ok(typeof textureFormat === 'string'));
    t.end();
  } else {
    const textureFormats = detectSupportedTextureFormats();
    t.equal(textureFormats.size, 0);
    t.end();
  }
});

test('selectSupportedBasisFormat', (t) => {
  t.equal(
    selectSupportedBasisFormat(['astc-4x4-unorm']),
    'astc-4x4',
    'ASTC texture formats select ASTC format'
  );
  t.deepEqual(
    selectSupportedBasisFormat(['bc7-rgba-unorm']),
    {alpha: 'bc7-m5', noAlpha: 'bc7-m6-opaque-only'},
    'BC7 texture formats select BC7 formats'
  );
  t.deepEqual(
    selectSupportedBasisFormat(['bc3-rgba-unorm']),
    {alpha: 'bc3', noAlpha: 'bc1'},
    'BC texture formats select BC formats'
  );
  t.equal(
    selectSupportedBasisFormat(['bc5-rg-unorm']),
    'rgb565',
    'RGTC-only texture formats do not infer BC1/BC3 support'
  );
  t.equal(
    selectSupportedBasisFormat(['etc2-rgba8unorm']),
    'etc2',
    'ETC2 texture formats select ETC2 format'
  );
  t.equal(
    selectSupportedBasisFormat(['etc1-rbg-unorm-ext']),
    'etc1',
    'ETC1 extension texture formats select ETC1 format'
  );
  t.equal(selectSupportedBasisFormat([]), 'rgb565', 'fallback selects RGB565');
  t.end();
});

test('getSupportedBasisFormats', (t) => {
  const supportedBasisFormats = getSupportedBasisFormats([
    'bc3-rgba-unorm',
    'bc7-rgba-unorm',
    'etc2-rgba8unorm'
  ] as TextureFormat[]);

  t.ok(supportedBasisFormats.includes('bc3'), 'BC formats are reported');
  t.ok(supportedBasisFormats.includes('bc7-m5'), 'BC7 formats are reported');
  t.ok(supportedBasisFormats.includes('etc2'), 'ETC2 formats are reported');
  t.ok(supportedBasisFormats.includes('rgb565'), 'fallback CPU format is always reported');
  t.end();
});
