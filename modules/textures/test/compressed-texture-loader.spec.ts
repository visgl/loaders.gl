// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';

import {CompressedTextureLoader} from '@loaders.gl/textures';
import {load, setLoaderOptions} from '@loaders.gl/core';
import {
  GL_COMPRESSED_RGB_ETC1_WEBGL,
  GL_COMPRESSED_RGB_S3TC_DXT1_EXT,
  GL_COMPRESSED_RGBA_S3TC_DXT5_EXT
} from '../src/lib/gl-extensions';

const KTX_URL = '@loaders.gl/textures/test/data/test_etc1s.ktx2';
const KTX2_URL = '@loaders.gl/textures/test/data/kodim23.ktx2';
const DDS_URL = '@loaders.gl/textures/test/data/shannon-dxt5.dds';
const PVR_URL = '@loaders.gl/textures/test/data/shannon-etc1.pvr';

setLoaderOptions({
  _workerType: 'test'
});

test('CompressedTextureLoader#imports', (t) => {
  t.ok(CompressedTextureLoader, 'CompressedTextureLoader defined');
  t.end();
});

test('CompressedTextureLoader#KTX', async (t) => {
  const texture = await load(KTX_URL, CompressedTextureLoader);
  t.ok(texture, 'KTX container loaded OK');
  t.end();
});

test('CompressedTextureLoader#KTX2 with BasisLoader', async (t) => {
  const texture = await load(KTX2_URL, CompressedTextureLoader, {
    'compressed-texture': {useBasis: true}
  });
  t.ok(texture, 'KTX2 container loaded OK');
  t.equals(texture[0].format, GL_COMPRESSED_RGB_S3TC_DXT1_EXT, 'KTX2 WebGL format is set');
  t.equals(texture[0].textureFormat, 'bc1-rgb-unorm-webgl', 'KTX2 texture format is set');
  t.end();
});

test('CompressedTextureLoader#DDS', async (t) => {
  const texture = await load(DDS_URL, CompressedTextureLoader);
  t.ok(texture, 'DDS container loaded OK');
  t.equals(texture[0].format, GL_COMPRESSED_RGBA_S3TC_DXT5_EXT, 'DDS WebGL format is set');
  t.equals(texture[0].textureFormat, 'bc3-rgba-unorm', 'DDS texture format is set');
  t.end();
});

test('CompressedTextureLoader#PVR', async (t) => {
  const texture = await load(PVR_URL, CompressedTextureLoader);
  t.ok(texture, 'PVR container loaded OK');
  t.equals(texture[0].format, GL_COMPRESSED_RGB_ETC1_WEBGL, 'PVR WebGL format is set');
  t.equals(texture[0].textureFormat, 'etc1-rbg-unorm-webgl', 'PVR texture format is set');
  t.end();
});
