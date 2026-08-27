// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {load} from '@loaders.gl/core';
import {GLTFLoader, GLTFScenegraph, postProcessGLTF} from '@loaders.gl/gltf';
const GLTF_BINARY_URL = '@loaders.gl/gltf/test/data/3d-tiles/143.glb';
// biome-ignore format: preserve intentional fixture layout
const PNG1x1 = new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00,
    0x0d, 0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00,
    0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89,
    0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63,
    0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0a
]);
test('GLTFScenegraph#ctor', () => {
  const gltfScenegraph = new GLTFScenegraph();
  expect(gltfScenegraph).toBeTruthy();
});
test('GLTFScenegraph#addImage', () => {
  // Smallest valid png
  const gltfScenegraph = new GLTFScenegraph();
  // t.throws(() => gltfScenegraph.addImage(PNG1x1), 'addImage() throws if no MIMEType');
  const imageIndex = gltfScenegraph.addImage(PNG1x1);
  expect(imageIndex, 'Image index should be 0').toBe(0);
  // t.equals(gltfScenegraph.json.buffers.length, 1, 'gltf buffer added as expected');
  expect(gltfScenegraph.json.bufferViews?.length, 'gltf bufferView added as expected').toBe(1);
  expect(gltfScenegraph.json.images?.length, 'gltf image set as expected').toBe(1);
  // @ts-expect-error
  const {bufferView, mimeType} = gltfScenegraph.json.images[0];
  expect(bufferView, 'bufferView index is 0').toBe(0);
  expect(mimeType, 'mimeType is png').toBe('image/png');
});
test('GLTFScenegraph#Should be able to write custom attribute', async () => {
  const gltfWithBuffers = await load(GLTF_BINARY_URL, GLTFLoader);
  const inputData = postProcessGLTF(gltfWithBuffers);
  const gltfBuilder = new GLTFScenegraph();
  gltfBuilder.addMesh({
    attributes: {
      POSITION: inputData.meshes[0].primitives[0].attributes.POSITION,
      _BATCHID: inputData.meshes[0].primitives[0].attributes.TEXCOORD_0
    }
  });
  expect(gltfBuilder.gltf.json.meshes?.[0]).toBeTruthy();
  expect(gltfBuilder.gltf.json.meshes?.[0].primitives[0].attributes._BATCHID).toBeTruthy();
});
test('GLTFScenegraph#Should calculate min and max arrays for accessor', async () => {
  const gltfWithBuffers = await load(GLTF_BINARY_URL, GLTFLoader);
  const inputData = postProcessGLTF(gltfWithBuffers);
  // addMesh does not yet support adding additional accessor attributes, and does not auto calculate them
  delete inputData.meshes[0].primitives[0].attributes.POSITION.min;
  delete inputData.meshes[0].primitives[0].attributes.POSITION.max;
  const gltfBuilder = new GLTFScenegraph();
  gltfBuilder.addMesh({
    attributes: {
      POSITION: inputData.meshes[0].primitives[0].attributes.POSITION
    }
  });
  expect(gltfBuilder.gltf.json.accessors?.[0]).toBeTruthy();
  expect(gltfBuilder.gltf.json.accessors?.[0].min).toEqual([
    -2316.5927734375, -3864.65771484375, -3551.852294921875
  ]);
  expect(gltfBuilder.gltf.json.accessors?.[0].max).toEqual([
    2647.046875, 4302.39111328125, 3733.835205078125
  ]);
});
test('GLTFScenegraph#Nodes should store `matrix` transformation data', async () => {
  const gltfWithBuffers = await load(GLTF_BINARY_URL, GLTFLoader);
  const inputData = postProcessGLTF(gltfWithBuffers);
  const gltfBuilder = new GLTFScenegraph();
  const meshIndex = gltfBuilder.addMesh({
    attributes: {
      POSITION: inputData.meshes[0].primitives[0].attributes.POSITION
    }
  });
  const inputMatrix = [1, 0, 0, 0, 0, 0, -1, 0, 0, 1, 0, 0, 0, 0, 0, 1];
  const nodeIndex = gltfBuilder.addNode({meshIndex, matrix: inputMatrix});
  expect(gltfBuilder.gltf.json.nodes?.[nodeIndex]).toBeTruthy();
  const testMatrix = [1, 0, 0, 0, 0, 0, -1, 0, 0, 1, 0, 0, 0, 0, 0, 1];
  expect(gltfBuilder.gltf.json.nodes?.[nodeIndex].matrix).toEqual(testMatrix);
  const nodeIndex2 = gltfBuilder.addNode({meshIndex});
  expect(gltfBuilder.gltf.json.nodes?.[nodeIndex2]).toBeTruthy();
  expect(gltfBuilder.gltf.json.nodes?.[nodeIndex2].matrix).toBeFalsy();
});
