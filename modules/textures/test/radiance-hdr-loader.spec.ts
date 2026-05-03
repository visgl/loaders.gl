// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';

import {load, setLoaderOptions} from '@loaders.gl/core';
import {RadianceHDRLoader} from '@loaders.gl/textures';
import {GL_RGBA32F} from '../src/lib/gl-extensions';

const HDR_URL = '@loaders.gl/textures/test/data/simple-rle.hdr';
const POLY_HAVEN_HDR_URL = '@loaders.gl/textures/test/data/venice_sunset_256.hdr';

setLoaderOptions({
  _workerType: 'test'
});

test('RadianceHDRLoader#imports', t => {
  t.ok(RadianceHDRLoader, 'RadianceHDRLoader defined');
  t.end();
});

test('RadianceHDRLoader#load(URL)', async t => {
  const texture = await load(HDR_URL, RadianceHDRLoader);
  const level = texture.data[0];

  t.equal(texture.shape, 'texture', 'returns a texture payload');
  t.equal(texture.type, '2d', 'texture type is correct');
  t.equal(texture.format, 'rgba32float', 'texture format is correct');
  t.equal(texture.data.length, 1, 'returns a single texture level');
  t.equal(level.shape, 'texture-level', 'level shape is correct');
  t.equal(level.width, 8, 'width is correct');
  t.equal(level.height, 2, 'height is correct');
  t.equal(level.compressed, false, 'decoded data is uncompressed');
  t.ok(level.data instanceof Float32Array, 'decoded data is float32');
  t.equal(level.levelSize, level.data.byteLength, 'level size matches float data size');
  t.equal(level.textureFormat, 'rgba32float', 'texture format is correct');
  t.equal(level.format, GL_RGBA32F, 'WebGL format is correct');

  const data = level.data as Float32Array;
  t.equal(data[0], 2, 'first pixel preserves bright intensity');
  t.equal(data[1], 0, 'first pixel green is correct');
  t.equal(data[2], 0, 'first pixel blue is correct');
  t.equal(data[3], 1, 'first pixel alpha is synthesized');
  t.ok(data[0] > 1, 'decoded data contains HDR values above 1');

  const secondRowPixelOffset = (8 + 3) * 4;
  t.ok(Math.abs(data[secondRowPixelOffset] - 3 / 255) < 1e-6, 'literal run red channel is decoded');
  t.ok(
    Math.abs(data[secondRowPixelOffset + 1] - 10 / 255) < 1e-6,
    'literal run green channel is decoded'
  );
  t.ok(
    Math.abs(data[secondRowPixelOffset + 2] - 20 / 255) < 1e-6,
    'literal run blue channel is decoded'
  );
  t.equal(data[secondRowPixelOffset + 3], 1, 'literal run alpha is synthesized');

  t.end();
});

test('RadianceHDRLoader#load(Poly Haven URL)', async t => {
  const texture = await load(POLY_HAVEN_HDR_URL, RadianceHDRLoader);
  const level = texture.data[0];
  const data = level.data as Float32Array;

  t.equal(texture.shape, 'texture', 'returns a texture payload');
  t.equal(texture.type, '2d', 'poly haven texture type is correct');
  t.equal(texture.format, 'rgba32float', 'poly haven top-level format is correct');
  t.equal(texture.data.length, 1, 'returns a single texture level');
  t.equal(level.width, 256, 'poly haven width is correct');
  t.equal(level.height, 128, 'poly haven height is correct');
  t.equal(level.textureFormat, 'rgba32float', 'poly haven texture format is correct');
  t.equal(level.format, GL_RGBA32F, 'poly haven WebGL format is correct');
  t.ok(level.data instanceof Float32Array, 'poly haven data is float32');
  t.ok(
    data.some(value => value > 1),
    'poly haven data keeps HDR intensity'
  );

  t.end();
});
