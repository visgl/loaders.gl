/* eslint-disable max-len */
import test from 'tape-promise/tape';

import {GLTFScenegraph} from '@loaders.gl/gltf';

import {loadI3STileContent} from '../../../i3s/test/lib/utils/load-utils';

// prettier-ignore
const PNG1x1 = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00,
  0x0d, 0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00,
  0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89,
  0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63,
  0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0a
]);

test('GLTFScenegraph#ctor', t => {
  const gltfScenegraph = new GLTFScenegraph();
  t.ok(gltfScenegraph);
  t.end();
});

test('GLTFScenegraph#addImage', t => {
  // Smallest valid png
  const gltfScenegraph = new GLTFScenegraph();

  // t.throws(() => gltfScenegraph.addImage(PNG1x1), 'addImage() throws if no MIMEType');

  const imageIndex = gltfScenegraph.addImage(PNG1x1);
  t.equal(imageIndex, 0, 'Image index should be 0');

  // t.equals(gltfScenegraph.json.buffers.length, 1, 'gltf buffer added as expected');
  t.equals(gltfScenegraph.json.bufferViews.length, 1, 'gltf bufferView added as expected');
  t.equals(gltfScenegraph.json.images.length, 1, 'gltf image set as expected');

  const {bufferView, mimeType} = gltfScenegraph.json.images[0];
  t.equal(bufferView, 0, 'bufferView index is 0');
  t.equal(mimeType, 'image/png', 'mimeType is png');

  t.end();
});

test('GLTFWriter#Should be able to write custom attribute', async t => {
  const i3sContent = await loadI3STileContent();
  const gltfBuilder = new GLTFScenegraph();

  i3sContent.attributes.positions.value = new Float32Array(i3sContent.attributes.positions.value);
  gltfBuilder.addMesh({
    positions: i3sContent.attributes.positions,
    _BATCHID: i3sContent.attributes.normals
  });
  t.ok(gltfBuilder.gltf.json.meshes[0]);
  t.ok(gltfBuilder.gltf.json.meshes[0].primitives[0].attributes._BATCHID);

  t.end();
});
