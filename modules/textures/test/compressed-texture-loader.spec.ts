// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {CompressedTextureLoader} from '@loaders.gl/textures';
import {load, setLoaderOptions, isBrowser} from '@loaders.gl/core';
import {
  GL_COMPRESSED_RGB_ETC1_WEBGL,
  GL_COMPRESSED_RGB_S3TC_DXT1_EXT,
  GL_COMPRESSED_RGBA_S3TC_DXT5_EXT,
  GL_COMPRESSED_SRGB_S3TC_DXT1_EXT
} from '../src/lib/gl-extensions';
const KTX_URL = '@loaders.gl/textures/test/data/test_etc1s.ktx2';
const KTX2_URL = '@loaders.gl/textures/test/data/kodim23.ktx2';
const DDS_URL = '@loaders.gl/textures/test/data/shannon-dxt5.dds';
const PVR_URL = '@loaders.gl/textures/test/data/shannon-etc1.pvr';
setLoaderOptions({
  _workerType: 'test'
});
test('CompressedTextureLoader#imports', () => {
  expect(CompressedTextureLoader, 'CompressedTextureLoader defined').toBeTruthy();
});
test('CompressedTextureLoader#KTX', async () => {
  const texture = await load(KTX_URL, CompressedTextureLoader);
  expect(texture, 'KTX container loaded OK').toBeTruthy();
});
test('CompressedTextureLoader#KTX2 with BasisLoader', async () => {
  const texture = await load(KTX2_URL, CompressedTextureLoader, {
    'compressed-texture': {useBasis: true},
    basis: {format: 'bc1'}
  });
  expect(texture, 'KTX2 container loaded OK').toBeTruthy();
  expect(texture[0].format, 'KTX2 WebGL format is set').toBe(GL_COMPRESSED_SRGB_S3TC_DXT1_EXT);
  expect(texture[0].textureFormat, 'KTX2 texture format is set').toBe('bc1-rgb-unorm-srgb-webgl');
});
test('CompressedTextureLoader#DDS', async () => {
  const texture = await load(DDS_URL, CompressedTextureLoader);
  expect(texture, 'DDS container loaded OK').toBeTruthy();
  expect(texture[0].format, 'DDS WebGL format is set').toBe(GL_COMPRESSED_RGBA_S3TC_DXT5_EXT);
  expect(texture[0].textureFormat, 'DDS texture format is set').toBe('bc3-rgba-unorm');
});
test('CompressedTextureLoader#PVR', async () => {
  const texture = await load(PVR_URL, CompressedTextureLoader);
  expect(texture, 'PVR container loaded OK').toBeTruthy();
  expect(texture[0].format, 'PVR WebGL format is set').toBe(GL_COMPRESSED_RGB_ETC1_WEBGL);
  expect(texture[0].textureFormat, 'PVR texture format is set').toBe('etc1-rgb-unorm-webgl');
});
test('CompressedTextureLoader#uses injected transcoder modules for KTX2 Basis textures', async () => {
  if (isBrowser) {
    return;
  }
  class FakeKTX2File {
    constructor(data: Uint8Array) {
      expect(data.byteLength).toBe(4);
    }
    startTranscoding() {
      return true;
    }
    isValid() {
      return true;
    }
    getHeader() {
      return {pixelDepth: 0};
    }
    getLayers() {
      return 0;
    }
    getFaces() {
      return 1;
    }
    getBasisTexFormat() {
      return 0;
    }
    isHDR() {
      return false;
    }
    isSRGB() {
      return false;
    }
    getHasAlpha() {
      return false;
    }
    getBlockWidth() {
      return 4;
    }
    getBlockHeight() {
      return 4;
    }
    getLevels() {
      return 1;
    }
    getImageLevelInfo() {
      return {
        alphaFlag: false,
        height: 2,
        width: 2
      };
    }
    getImageTranscodedSizeInBytes() {
      return 8;
    }
    transcodeImage(decodedData: Uint8Array) {
      decodedData.set([1, 2, 3, 4, 5, 6, 7, 8]);
      return true;
    }
    close() {}
    delete() {}
  }
  const texture = await load(new Uint8Array([1, 2, 3, 4]).buffer, CompressedTextureLoader, {
    'compressed-texture': {useBasis: true},
    basis: {format: 'bc1'},
    modules: {
      basis: {KTX2File: FakeKTX2File}
    }
  });
  expect(texture[0].width).toBe(2);
  expect(texture[0].height).toBe(2);
  expect(texture[0].data.byteLength).toBe(8);
  expect(texture[0].format).toBe(GL_COMPRESSED_RGB_S3TC_DXT1_EXT);
});
