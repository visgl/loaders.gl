/* eslint-disable max-len */
import test from 'tape-promise/tape';
import {isBrowser, fetchFile} from '@loaders.gl/core';
import {parseImageNode} from '../../src/images/parse-image-node';
import {
  getImageDataNode,
  isNodeImageBitmap,
  NodeImageBitmap
} from '../../src/images/node-image-bitmap';

const images = [
  ['@loaders.gl/images/test/data/img1-preview.png', 'image/png'],
  ['@loaders.gl/images/test/data/img1-preview.jpeg', 'image/jpeg'],
  ['@loaders.gl/images/test/data/img1-preview.gif', 'image/gif']
];

if (!isBrowser) {
  test('Node image polyfills', (t) => {
    // @ts-ignore
    t.equals(
      typeof globalThis.loaders?.encodeImageNode,
      'function',
      'encodeImageNode successfully installed'
    );
    // @ts-ignore
    t.equals(
      typeof globalThis.loaders?.parseImageNode,
      'function',
      'parseImageNode successfully installed'
    );
    t.equals(typeof globalThis.loaders?.getImageDataNode, 'function', 'getImageDataNode installed');
    t.equals(
      typeof globalThis.loaders?.isImageBitmapNode,
      'function',
      'isImageBitmapNode installed'
    );
    t.equals(typeof globalThis.ImageBitmap, 'function', 'ImageBitmap installed');
    t.equals(typeof globalThis.getImageData, 'function', 'getImageData installed');

    t.end();
  });

  test('Node image polyfills - ImageBitmap wrapper', async (t) => {
    const response = await fetchFile(images[0][0]);
    const arrayBuffer = await response.arrayBuffer();
    const imageData = await parseImageNode(arrayBuffer, images[0][1]);
    const imageBitmap = new NodeImageBitmap(imageData);

    t.ok(imageBitmap instanceof ImageBitmap, 'NodeImageBitmap installs as global ImageBitmap');
    t.equals(isNodeImageBitmap(imageBitmap), true, 'isNodeImageBitmap recognizes bitmap');

    const unwrappedImage = getImageDataNode(imageBitmap);
    t.equals(unwrappedImage.width, imageData.width, 'width preserved');
    t.equals(unwrappedImage.height, imageData.height, 'height preserved');
    t.ok(unwrappedImage.data instanceof Uint8Array, 'data is Uint8Array');

    t.deepEquals(
      globalThis.getImageData(imageBitmap),
      unwrappedImage,
      'global getImageData unwraps bitmap'
    );

    imageBitmap.close();
    t.throws(() => getImageDataNode(imageBitmap), 'closed bitmaps reject reads');

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
