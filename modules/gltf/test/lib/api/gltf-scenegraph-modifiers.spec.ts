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

test('GLTFScenegraph omits empty binary data and can subsequently pack appended data', () => {
  const scenegraph = new GLTFScenegraph();
  scenegraph.createBinaryChunk();
  scenegraph.createBinaryChunk();
  expect(scenegraph.json.buffers).toBeUndefined();
  expect(scenegraph.gltf.binary).toBeUndefined();
  expect(scenegraph.gltf.buffers).toEqual([]);

  scenegraph.addBufferView(new Uint8Array([1, 2, 3]));
  scenegraph.createBinaryChunk();
  expect(scenegraph.json.buffers).toEqual([{byteLength: 4}]);
  expect(Array.from(new Uint8Array(scenegraph.gltf.binary!))).toEqual([1, 2, 3, 0]);
  expect(scenegraph.json.bufferViews).toEqual([{buffer: 0, byteOffset: 0, byteLength: 3}]);
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

test('GLTFScenegraph covers metadata, extension, and object accessors', () => {
  const json: any = {
    asset: {version: '2.0'},
    custom: {enabled: true},
    extras: {owner: 'loaders.gl'},
    scenes: [{nodes: [0]}],
    nodes: [{mesh: 0}],
    skins: [{joints: [0]}],
    meshes: [{primitives: []}],
    materials: [{name: 'material'}],
    accessors: [{bufferView: 0, componentType: 5121, count: 4, type: 'SCALAR'}],
    textures: [{source: 0}],
    samplers: [{magFilter: 9729}],
    images: [{bufferView: 0, mimeType: 'image/png'}],
    bufferViews: [{buffer: 0, byteOffset: 1, byteLength: 2}],
    buffers: [{byteLength: 4}],
    extensions: {EXT_used: {value: 1}, EXT_required: {value: 2}},
    extensionsUsed: ['EXT_used', 'EXT_required'],
    extensionsRequired: ['EXT_required']
  };
  const arrayBuffer = new Uint8Array([0, 10, 20, 30]).buffer;
  const scenegraph = new GLTFScenegraph({
    json,
    buffers: [{arrayBuffer, byteOffset: 0, byteLength: 4}]
  });

  expect(scenegraph.getApplicationData('custom')).toEqual({enabled: true});
  expect(scenegraph.getExtraData('owner')).toBe('loaders.gl');
  expect(scenegraph.hasExtension('EXT_used')).toBe(true);
  expect(scenegraph.hasExtension('EXT_missing')).toBe(false);
  expect(scenegraph.getExtension('EXT_used')).toEqual({value: 1});
  expect(scenegraph.getRequiredExtension('EXT_required')).toEqual({value: 2});
  expect(scenegraph.getRequiredExtension('EXT_used')).toBeNull();
  expect(scenegraph.getScene(0)).toBe(json.scenes[0]);
  expect(scenegraph.getNode(0)).toBe(json.nodes[0]);
  expect(scenegraph.getSkin(0)).toBe(json.skins[0]);
  expect(scenegraph.getMesh(0)).toBe(json.meshes[0]);
  expect(scenegraph.getMaterial(0)).toBe(json.materials[0]);
  expect(scenegraph.getAccessor(0)).toBe(json.accessors[0]);
  expect(scenegraph.getTexture(0)).toBe(json.textures[0]);
  expect(scenegraph.getSampler(0)).toBe(json.samplers[0]);
  expect(scenegraph.getImage(0)).toBe(json.images[0]);
  expect(scenegraph.getBufferView(0)).toBe(json.bufferViews[0]);
  expect(scenegraph.getBuffer(0)).toBe(json.buffers[0]);
  expect(scenegraph.getObject('nodes', json.nodes[0])).toBe(json.nodes[0]);
  expect(Array.from(scenegraph.getTypedArrayForBufferView(0))).toEqual([10, 20]);
  expect(() => scenegraph.getNode(10)).toThrow(/Could not find nodes\[10\]/);
});

test('GLTFScenegraph covers extension mutation and compact scene construction', () => {
  const scenegraph = new GLTFScenegraph();
  const object: any = {};

  scenegraph.addApplicationData('application', {value: 1});
  scenegraph.addExtraData('extra', {value: 2});
  scenegraph.addObjectExtension(object, 'EXT_object', {enabled: true});
  expect(scenegraph.getObjectExtension(object, 'EXT_object')).toEqual({enabled: true});
  scenegraph.setObjectExtension(object, 'EXT_set', {value: 3});
  scenegraph.removeObjectExtension(object, 'EXT_set');
  scenegraph.removeObjectExtension(object, 'EXT_set');
  expect(scenegraph.getRemovedExtensions()).toContain('EXT_set');

  expect(scenegraph.addExtension('EXT_optional', {value: 4})).toEqual({value: 4});
  scenegraph.addRequiredExtension('EXT_required', {value: 5});
  scenegraph.registerUsedExtension('EXT_optional');
  scenegraph.registerRequiredExtension('EXT_required');
  expect(scenegraph.getUsedExtensions()).toEqual(['EXT_object', 'EXT_optional', 'EXT_required']);
  scenegraph.removeExtension('EXT_required');
  scenegraph.removeExtension('EXT_required');
  expect(scenegraph.getRemovedExtensions()).toEqual(
    expect.arrayContaining(['EXT_set', 'EXT_required'])
  );

  const position = {value: new Float32Array([0, 1, 2, 3, 4, 5]), size: 3};
  const indices = new Uint16Array([0, 1]);
  const meshIndex = scenegraph.addMesh({
    attributes: {
      vertices: position,
      normals: position,
      colors: {value: new Uint8Array([1, 2, 3, 4, 5, 6]), size: 3},
      texcoords: {value: new Float32Array([0, 0, 1, 1]), size: 2},
      custom: {value: new Float32Array([7, 8]), size: 1}
    },
    indices: indices as any,
    material: 0,
    mode: 1
  });
  expect(scenegraph.addPointCloud({POSITION: position})).toBe(1);
  expect(scenegraph.addNode({meshIndex})).toBe(0);
  expect(scenegraph.addScene({nodeIndices: [0]})).toBe(0);
  scenegraph.setDefaultScene(0);
  expect(scenegraph.addTexture({imageIndex: 0})).toBe(0);
  expect(scenegraph.addMaterial({name: 'material'})).toBe(0);
  expect(scenegraph.json.meshes?.[0].primitives[0]).toMatchObject({mode: 1, material: 0});
  expect(scenegraph.json.accessors?.[0].min).toEqual([0, 1, 2]);
  expect(scenegraph.json.accessors?.[0].max).toEqual([3, 4, 5]);

  scenegraph.createBinaryChunk();
  expect(scenegraph.gltf.binary?.byteLength).toBe(scenegraph.byteLength);
  expect(scenegraph.gltf.buffers[0].byteLength).toBe(scenegraph.byteLength);
});

test('GLTFScenegraph appends explicit samplers and links texture indices including zero', () => {
  const scenegraph = new GLTFScenegraph();
  const sampler = {wrapS: 33071, wrapT: 33648, magFilter: 9729, minFilter: 9987};
  expect(scenegraph.addSampler(sampler)).toBe(0);
  expect(scenegraph.addSampler({})).toBe(1);
  expect(scenegraph.getSampler(0)).toEqual(sampler);
  expect(scenegraph.getSampler(0)).not.toBe(sampler);
  expect(scenegraph.getSampler(1)).toEqual({});
  expect(scenegraph.addTexture({imageIndex: 0, samplerIndex: 0})).toBe(0);
  expect(scenegraph.addTexture({imageIndex: 1, samplerIndex: 1})).toBe(1);
  expect(scenegraph.addTexture({imageIndex: 2})).toBe(2);
  expect(scenegraph.json.textures).toEqual([
    {source: 0, sampler: 0},
    {source: 1, sampler: 1},
    {source: 2}
  ]);
  expect(sampler).toEqual({wrapS: 33071, wrapT: 33648, magFilter: 9729, minFilter: 9987});
});

test.each([
  true,
  false,
  undefined
])('GLTFScenegraph preserves accessor normalization %s', normalized => {
  const scenegraph = new GLTFScenegraph();
  const accessor = scenegraph.addBinaryBuffer(new Uint8Array([0, 255]), {size: 1, normalized});
  expect(scenegraph.json.accessors![accessor].normalized).toBe(normalized);
  expect(Object.hasOwn(scenegraph.json.accessors![accessor], 'normalized')).toBe(
    normalized !== undefined
  );
});

test.each([
  [Uint8Array, 2, 4],
  [Uint8Array, 3, 4],
  [Uint8Array, 4, 4],
  [Uint16Array, 2, 4],
  [Uint16Array, 3, 8]
] as const)('GLTFScenegraph aligns %s size %s vertex elements', (ArrayType, size, stride) => {
  const storage = new ArrayType([99, ...Array.from({length: size * 3}, (_, index) => index), 99]);
  const values = storage.subarray(1, -1);
  const before = storage.slice();
  const scenegraph = new GLTFScenegraph();
  scenegraph.addMesh({attributes: {_VALUES: {value: values, size, normalized: true}}});
  scenegraph.createBinaryChunk();
  const accessor = scenegraph.json.accessors![0];
  const bufferView = scenegraph.json.bufferViews![accessor.bufferView!];
  expect(bufferView.byteStride ?? size * values.BYTES_PER_ELEMENT).toBe(stride);
  expect(accessor).toMatchObject({normalized: true, count: 3});
  expect(scenegraph.getTypedArrayForAccessor(0)).toEqual(values);
  expect(storage).toEqual(before);
});
