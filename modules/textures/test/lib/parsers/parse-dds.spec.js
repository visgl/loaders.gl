import test from 'tape-promise/tape';
import {fetchFile} from '@loaders.gl/core';
import {parseDDS} from '../../../src/lib/parsers/parse-dds';
import {GL} from '../../../src/lib/gl-constants';
import {checkCompressedTexture} from '../../test-utils/check-compressed-texture';

const TEST_CASES = [
  {
    url: '@loaders.gl/textures/test/data/shannon-dxt1.dds',
    format: GL.COMPRESSED_RGB_S3TC_DXT1_EXT
  },
  {
    url: '@loaders.gl/textures/test/data/shannon-dxt3.dds',
    format: GL.COMPRESSED_RGBA_S3TC_DXT3_EXT
  },
  {
    url: '@loaders.gl/textures/test/data/shannon-dxt5.dds',
    format: GL.COMPRESSED_RGBA_S3TC_DXT5_EXT
  },
  {
    url: '@loaders.gl/textures/test/data/shannon-atc-rgb.dds',
    format: GL.COMPRESSED_RGB_ATC_WEBGL
  },
  {
    url: '@loaders.gl/textures/test/data/shannon-atc-rgba-explicit.dds',
    format: GL.COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA_WEBGL
  },
  {
    url: '@loaders.gl/textures/test/data/shannon-atc-rgba-interpolated.dds',
    format: GL.COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL
  }
];

test('CompressedTextureLoader#dds', async t => {
  for (const testCase of TEST_CASES) {
    const response = await fetchFile(testCase.url);
    const data = await response.arrayBuffer();
    const result = parseDDS(data);
    checkCompressedTexture(t, result, testCase);
  }
  t.end();
});
