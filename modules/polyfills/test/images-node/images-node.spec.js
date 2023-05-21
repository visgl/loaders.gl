/* eslint-disable max-len */
import test from 'tape-promise/tape';
import '@loaders.gl/polyfills';
import {isBrowser} from '../../src/utils/globals';
import {fetchFile} from '@loaders.gl/core';
import {parseImageNode} from '../../src/node/images/parse-image.node';

const images = [
  ['@loaders.gl/images/test/data/img1-preview.png', 'image/png'],
  ['@loaders.gl/images/test/data/img1-preview.jpeg', 'image/jpeg'],
  ['@loaders.gl/images/test/data/img1-preview.gif', 'image/gif']
];

test('Node image polyfills', (t) => {
  if (!isBrowser) {
    // @ts-ignore
    t.equals(typeof _encodeImageNode, 'function', 'global._encodeImageNode successfully installed');
    // @ts-ignore
    t.equals(typeof _parseImageNode, 'function', 'global._parseImageNode successfully installed');
  }
  t.end();
});

test('Node image polyfills - should return Uint8Array data', async (t) => {
  if (!isBrowser) {
    for (const image of images) {
      const [imageUrl, mimeType] = image;
      const response = await fetchFile(imageUrl);
      const arrayBuffer = await response.arrayBuffer();
      const result = await parseImageNode(arrayBuffer, mimeType);
      t.ok(result.data instanceof Uint8Array, `Loaded ${imageUrl} is Uint8Array`);
      t.notOk(result.data instanceof Buffer, `Loaded ${imageUrl} is not Buffer`);
    }
  }
  t.end();
});
