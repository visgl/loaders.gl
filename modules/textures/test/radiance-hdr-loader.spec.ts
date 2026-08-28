// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {load, setLoaderOptions} from '@loaders.gl/core';
import {RadianceHDRLoader} from '@loaders.gl/textures';
import {GL_RGBA32F} from '../src/lib/gl-extensions';
const HDR_URL = '@loaders.gl/textures/test/data/simple-rle.hdr';
const POLY_HAVEN_HDR_URL = '@loaders.gl/textures/test/data/venice_sunset_256.hdr';
setLoaderOptions({
  _workerType: 'test'
});
test('RadianceHDRLoader#imports', () => {
  expect(RadianceHDRLoader, 'RadianceHDRLoader defined').toBeTruthy();
});
test('RadianceHDRLoader#load(URL)', async () => {
  const texture = await load(HDR_URL, RadianceHDRLoader);
  const level = texture.data[0];
  expect(texture.shape, 'returns a texture payload').toBe('texture');
  expect(texture.type, 'texture type is correct').toBe('2d');
  expect(texture.format, 'texture format is correct').toBe('rgba32float');
  expect(texture.data.length, 'returns a single texture level').toBe(1);
  expect(level.shape, 'level shape is correct').toBe('texture-level');
  expect(level.width, 'width is correct').toBe(8);
  expect(level.height, 'height is correct').toBe(2);
  expect(level.compressed, 'decoded data is uncompressed').toBe(false);
  expect(level.data instanceof Float32Array, 'decoded data is float32').toBeTruthy();
  expect(level.levelSize, 'level size matches float data size').toBe(level.data.byteLength);
  expect(level.textureFormat, 'texture format is correct').toBe('rgba32float');
  expect(level.format, 'WebGL format is correct').toBe(GL_RGBA32F);
  const data = level.data as Float32Array;
  expect(data[0], 'first pixel preserves bright intensity').toBe(2);
  expect(data[1], 'first pixel green is correct').toBe(0);
  expect(data[2], 'first pixel blue is correct').toBe(0);
  expect(data[3], 'first pixel alpha is synthesized').toBe(1);
  expect(data[0] > 1, 'decoded data contains HDR values above 1').toBeTruthy();
  const secondRowPixelOffset = (8 + 3) * 4;
  expect(
    Math.abs(data[secondRowPixelOffset] - 3 / 255) < 1e-6,
    'literal run red channel is decoded'
  ).toBeTruthy();
  expect(
    Math.abs(data[secondRowPixelOffset + 1] - 10 / 255) < 1e-6,
    'literal run green channel is decoded'
  ).toBeTruthy();
  expect(
    Math.abs(data[secondRowPixelOffset + 2] - 20 / 255) < 1e-6,
    'literal run blue channel is decoded'
  ).toBeTruthy();
  expect(data[secondRowPixelOffset + 3], 'literal run alpha is synthesized').toBe(1);
});
test('RadianceHDRLoader#load(Poly Haven URL)', async () => {
  const texture = await load(POLY_HAVEN_HDR_URL, RadianceHDRLoader);
  const level = texture.data[0];
  const data = level.data as Float32Array;
  expect(texture.shape, 'returns a texture payload').toBe('texture');
  expect(texture.type, 'poly haven texture type is correct').toBe('2d');
  expect(texture.format, 'poly haven top-level format is correct').toBe('rgba32float');
  expect(texture.data.length, 'returns a single texture level').toBe(1);
  expect(level.width, 'poly haven width is correct').toBe(256);
  expect(level.height, 'poly haven height is correct').toBe(128);
  expect(level.textureFormat, 'poly haven texture format is correct').toBe('rgba32float');
  expect(level.format, 'poly haven WebGL format is correct').toBe(GL_RGBA32F);
  expect(level.data instanceof Float32Array, 'poly haven data is float32').toBeTruthy();
  expect(
    data.some(value => value > 1),
    'poly haven data keeps HDR intensity'
  ).toBeTruthy();
});
