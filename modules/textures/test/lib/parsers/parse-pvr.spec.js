import test from 'tape-promise/tape';
import {fetchFile} from '@loaders.gl/core';
import {parsePVR} from '../../../src/lib/parsers/parse-pvr';
import {GL} from '../../../src/lib/gl-constants';
import {checkCompressedTexture} from '../../test-utils/check-compressed-texture';

const TEST_CASES = [
  {
    url: '@loaders.gl/textures/test/data/shannon-pvrtc-2bpp-rgb.pvr',
    format: GL.COMPRESSED_RGB_PVRTC_2BPPV1_IMG
  },
  {
    url: '@loaders.gl/textures/test/data/shannon-pvrtc-2bpp-rgba.pvr',
    format: GL.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG
  },
  {
    url: '@loaders.gl/textures/test/data/shannon-pvrtc-4bpp-rgb.pvr',
    format: GL.COMPRESSED_RGB_PVRTC_4BPPV1_IMG
  },
  {
    url: '@loaders.gl/textures/test/data/shannon-pvrtc-4bpp-rgba.pvr',
    format: GL.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG
  },
  {
    url: '@loaders.gl/textures/test/data/shannon-astc-10x10.pvr',
    format: GL.COMPRESSED_RGBA_ASTC_10X10_KHR
  },
  {
    url: '@loaders.gl/textures/test/data/shannon-astc-srgb-10x10.pvr',
    format: GL.COMPRESSED_SRGB8_ALPHA8_ASTC_10X10_KHR
  }
];

test('CompressedTextureLoader#pvr', async t => {
  for (const testCase of TEST_CASES) {
    const response = await fetchFile(testCase.url);
    const data = await response.arrayBuffer();
    const result = parsePVR(data);
    checkCompressedTexture(t, result, testCase);
  }
  t.end();
});
