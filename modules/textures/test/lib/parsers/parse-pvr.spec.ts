// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* eslint-disable camelcase */
import test from 'tape-promise/tape';
import {fetchFile} from '@loaders.gl/core';
import {parsePVR} from '../../../src/lib/parsers/parse-pvr';
import {
  GL_COMPRESSED_RGB_PVRTC_2BPPV1_IMG,
  GL_COMPRESSED_RGB_PVRTC_4BPPV1_IMG,
  GL_COMPRESSED_RGBA_ASTC_10x10_KHR,
  GL_COMPRESSED_RGBA_PVRTC_2BPPV1_IMG,
  GL_COMPRESSED_RGBA_PVRTC_4BPPV1_IMG,
  GL_COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR
} from '../../../src/lib/gl-extensions';
import {checkCompressedTexture} from '../../test-utils/check-compressed-texture';

const TEST_CASES = [
  {
    url: '@loaders.gl/textures/test/data/shannon-pvrtc-2bpp-rgb.pvr',
    format: GL_COMPRESSED_RGB_PVRTC_2BPPV1_IMG,
    textureFormat: 'pvrtc-rbg2unorm-webgl'
  },
  {
    url: '@loaders.gl/textures/test/data/shannon-pvrtc-2bpp-rgba.pvr',
    format: GL_COMPRESSED_RGBA_PVRTC_2BPPV1_IMG,
    textureFormat: 'pvrtc-rgba2unorm-webgl'
  },
  {
    url: '@loaders.gl/textures/test/data/shannon-pvrtc-4bpp-rgb.pvr',
    format: GL_COMPRESSED_RGB_PVRTC_4BPPV1_IMG,
    textureFormat: 'pvrtc-rgb4unorm-webgl'
  },
  {
    url: '@loaders.gl/textures/test/data/shannon-pvrtc-4bpp-rgba.pvr',
    format: GL_COMPRESSED_RGBA_PVRTC_4BPPV1_IMG,
    textureFormat: 'pvrtc-rgba4unorm-webgl'
  },
  {
    url: '@loaders.gl/textures/test/data/shannon-astc-10x10.pvr',
    format: GL_COMPRESSED_RGBA_ASTC_10x10_KHR,
    textureFormat: 'astc-10x10-unorm'
  },
  {
    url: '@loaders.gl/textures/test/data/shannon-astc-srgb-10x10.pvr',
    format: GL_COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR,
    textureFormat: 'astc-10x10-unorm-srgb'
  }
];

test('CompressedTextureLoader#pvr', async (t) => {
  for (const testCase of TEST_CASES) {
    const response = await fetchFile(testCase.url);
    const data = await response.arrayBuffer();
    const result = parsePVR(data);
    checkCompressedTexture(t, result, testCase);
  }
  t.end();
});
