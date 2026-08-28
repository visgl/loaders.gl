// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {GLTFScenegraph, GLTFLoader} from '@loaders.gl/gltf';
import {load} from '@loaders.gl/core';
// Extracted from Cesium 3D Tiles
const GLB_TILE_WITH_DRACO_URL = '@loaders.gl/gltf/test/data/3d-tiles/143.glb';
const GLB_MESHOPT_GEOMETRY_URL = '@loaders.gl/gltf/test/data/meshopt/pirate.glb';
const GLB_KTX2_GEOMETRY_URL = '@loaders.gl/3d-tiles/test/data/CesiumJS/VNext/agi-ktx2/0/0.glb';
test('GLTFScenegraph#ctor', () => {
  const gltfScenegraph = new GLTFScenegraph();
  expect(gltfScenegraph).toBeTruthy();
});
test('GLTFScenegraph#should detect meshopt content', async () => {
  const gltf = await load(GLB_MESHOPT_GEOMETRY_URL, GLTFLoader, {
    gltf: {decompressMeshes: true}
  });
  const gltfScenegraph = new GLTFScenegraph(gltf);
  expect(gltfScenegraph).toBeTruthy();
  expect(gltfScenegraph.getRemovedExtensions(), 'removedExtions === meshopt').toEqual([
    'EXT_meshopt_compression'
  ]);
  expect(gltfScenegraph.getUsedExtensions(), 'usedExtensions no longer contain meshopt').toEqual([
    'KHR_mesh_quantization'
  ]);
});
test('GLTFScenegraph#should detect meshopt and ktx2 content', async () => {
  const gltf = await load(GLB_KTX2_GEOMETRY_URL, GLTFLoader, {
    gltf: {decompressMeshes: false}
  });
  const gltfScenegraph = new GLTFScenegraph(gltf);
  expect(gltfScenegraph).toBeTruthy();
  expect(gltfScenegraph.getRemovedExtensions()).toEqual([
    'KHR_texture_basisu',
    'KHR_materials_unlit'
  ]);
  expect(gltfScenegraph.gltf.json.extensionsUsed).toEqual([]);
});
test('GLTFScenegraph#BufferView indices resolve correctly', async () => {
  const gltf = await load(GLB_TILE_WITH_DRACO_URL, GLTFLoader, {
    gltf: {decompressMeshes: true}
  });
  const gltfScenegraph = new GLTFScenegraph(gltf);
  expect(gltfScenegraph.getRemovedExtensions()).toEqual([
    'KHR_draco_mesh_compression',
    'KHR_materials_unlit'
  ]);
  expect(gltfScenegraph.gltf.json.extensionsUsed).toEqual([]);
  // @ts-expect-error
  expect(gltfScenegraph.json.bufferViews.length, 'gltf bufferView count as expected').toBe(4);
  expect(
    gltfScenegraph.getTypedArrayForBufferView(0).byteOffset,
    'first bufferView offset correct'
  ).toBe(2868);
  expect(
    gltfScenegraph.getTypedArrayForBufferView(1).byteOffset,
    'second bufferView offset correct'
  ).toBe(70432);
});
