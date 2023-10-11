/* eslint-disable max-len */
import test from 'tape-promise/tape';
import {isBrowser, fetchFile} from '@loaders.gl/core';
import {parseImageNode} from '../../src/images/parse-image.node';

const images = [
  ['@loaders.gl/images/test/data/img1-preview.png', 'image/png'],
  ['@loaders.gl/images/test/data/img1-preview.jpeg', 'image/jpeg'],
  ['@loaders.gl/images/test/data/img1-preview.gif', 'image/gif']
];

if (!isBrowser) {
  test('Node image polyfills', (t) => {
    // @ts-ignore
    t.equals(typeof _encodeImageNode, 'function', 'global._encodeImageNode successfully installed');
    // @ts-ignore
    t.equals(typeof _parseImageNode, 'function', 'global._parseImageNode successfully installed');

    t.end();
  });

  test.skip('Node image polyfills - should return Uint8Array data', async (t) => {
    for (const image of images) {
      const [imageUrl, mimeType] = image;
      const response = await fetchFile(imageUrl);
      const arrayBuffer = await response.arrayBuffer();
      const result = await parseImageNode(arrayBuffer, mimeType);
      t.ok(result.data instanceof Uint8Array, `Loaded ${imageUrl} is Uint8Array`);
      t.notOk(result.data instanceof Buffer, `Loaded ${imageUrl} is not Buffer`);
    }
    t.end();
  });
}
