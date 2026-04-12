import {expect, test} from 'vitest';
import {isBrowser, fetchFile} from '@loaders.gl/core';
import {parseImageNode} from '../../src/images/parse-image-node';
import {
  getImageBitmapDataNode,
  isNodeImageBitmap,
  NodeImageBitmap
} from '../../src/images/node-image-bitmap';
const images = [
  ['@loaders.gl/images/test/data/img1-preview.png', 'image/png'],
  ['@loaders.gl/images/test/data/img1-preview.jpeg', 'image/jpeg'],
  ['@loaders.gl/images/test/data/img1-preview.gif', 'image/gif']
];
if (!isBrowser) {
  test('Node image polyfills', () => {
    // @ts-ignore
    expect(
      typeof globalThis.loaders?.encodeImageNode,
      'encodeImageNode successfully installed'
    ).toBe('function');
    // @ts-ignore
    expect(typeof globalThis.loaders?.parseImageNode, 'parseImageNode successfully installed').toBe(
      'function'
    );
    expect(
      typeof globalThis.loaders?.getImageBitmapDataNode,
      'getImageBitmapDataNode installed'
    ).toBe('function');
    expect(
      typeof globalThis.loaders?.createImageBitmapNode,
      'createImageBitmapNode installed'
    ).toBe('function');
    expect(typeof globalThis.loaders?.isImageBitmapNode, 'isImageBitmapNode installed').toBe(
      'function'
    );
    expect(typeof globalThis.ImageBitmap, 'ImageBitmap installed').toBe('function');
    expect(typeof globalThis.getImageBitmapData, 'getImageBitmapData installed').toBe('function');
  });
  test('Node image polyfills - ImageBitmap wrapper', async () => {
    const imageData = {
      data: new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255]),
      width: 2,
      height: 1
    };
    const imageBitmap = new NodeImageBitmap(imageData);
    expect(
      imageBitmap instanceof ImageBitmap,
      'NodeImageBitmap installs as global ImageBitmap'
    ).toBeTruthy();
    expect(isNodeImageBitmap(imageBitmap), 'isNodeImageBitmap recognizes bitmap').toBe(true);
    const unwrappedImage = getImageBitmapDataNode(imageBitmap);
    expect(unwrappedImage.width, 'width preserved').toBe(imageData.width);
    expect(unwrappedImage.height, 'height preserved').toBe(imageData.height);
    expect(unwrappedImage.data instanceof Uint8Array, 'data is Uint8Array').toBeTruthy();
    expect(
      globalThis.getImageBitmapData(imageBitmap),
      'global getImageBitmapData unwraps bitmap'
    ).toEqual(unwrappedImage);
    imageBitmap.close();
    expect(() => getImageBitmapDataNode(imageBitmap), 'closed bitmaps reject reads').toThrow();
  });
  test.skip('Node image polyfills - should return Uint8Array data', async () => {
    for (const image of images) {
      const [imageUrl, mimeType] = image;
      const response = await fetchFile(imageUrl);
      const arrayBuffer = await response.arrayBuffer();
      const result = await parseImageNode(arrayBuffer, mimeType);
      expect(result.data instanceof Uint8Array, `Loaded ${imageUrl} is Uint8Array`).toBeTruthy();
      expect(result.data instanceof Buffer, `Loaded ${imageUrl} is not Buffer`).toBeFalsy();
    }
  });
}
