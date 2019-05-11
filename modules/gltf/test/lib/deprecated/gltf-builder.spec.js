/* eslint-disable max-len */
import test from 'tape-promise/tape';

import {GLTFBuilder} from '@loaders.gl/gltf';

// prettier-ignore
const PNG1x1 = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00,
  0x0d, 0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00,
  0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89,
  0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63,
  0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0a
]);

test('GLTFBuilder#ctor', t => {
  const gltfBuilder = new GLTFBuilder();
  t.equals(0, gltfBuilder.getByteLength(), 'New builder has 0 byte length');
  t.end();
});

test('GLTFBuilder#addImage', t => {
  // Smallest valid png
  const gltfBuilder = new GLTFBuilder();
  const imageIndex = gltfBuilder.addImage(PNG1x1);
  t.equal(imageIndex, 0, 'Image index should be 0');

  t.deepEquals(
    gltfBuilder._getInternalCounts(),
    {buffers: 1, bufferViews: 1, accessors: 0, images: 1},
    'gltf properties set as expected'
  );

  const {bufferView, mimeType, width, height} = gltfBuilder.json.images[0];
  t.equal(bufferView, 0, 'bufferView index is 0');
  t.equal(mimeType, 'image/png', 'mimeType is png');
  t.equal(width, 1, 'width is 1');
  t.equal(height, 1, 'height is 1');

  t.end();
});
