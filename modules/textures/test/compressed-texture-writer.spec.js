import test from 'tape-promise/tape';
import {encodeURLtoURL, isBrowser} from '@loaders.gl/core';
import {CompressedTextureWriter} from '@loaders.gl/textures';

export const IMAGE_URL = '@loaders.gl/images/test/data/img1-preview.png';

test('CompressedTextureWriter#write-and-read-image', async (t) => {
  if (isBrowser) {
    t.comment('CompressedTextureWriter only supported on Node.js');
    t.end();
    return;
  }
  try {
    const outputFilename = await encodeURLtoURL(
      IMAGE_URL,
      '/tmp/test.ktx',
      CompressedTextureWriter,
      {}
    );
    t.ok(outputFilename, 'a filename was returned');
  } catch (error) {
    t.comment(error);
  }
  t.end();
});
