/* eslint-disable max-len */
import test from 'tape-promise/tape';

import {GLTFScenegraph} from '@loaders.gl/gltf';
import {GLTFLoader} from '@loaders.gl/gltf';
import {DracoLoader} from '@loaders.gl/draco';
import {load} from '@loaders.gl/core';

// Extracted from Cesium 3D Tiles
const GLB_TILE_WITH_DRACO_URL = '@loaders.gl/gltf/test/data/3d-tiles/143.glb';

const GLB_MESHOPT_GEOMETRY_URL = '@loaders.gl/gltf/test/data/meshopt/pirate.glb';
const GLB_KTX2_GEOMETRY_URL = '@loaders.gl/3d-tiles/test/data/VNext/agi-ktx2/0/0.glb';

test('GLTFScenegraph#ctor', (t) => {
  const gltfScenegraph = new GLTFScenegraph();
  t.ok(gltfScenegraph);
  t.deepEquals(gltfScenegraph.gltf.json.extensionsProcessed, []);
  t.end();
});

test('GLTFScenegraph#should detect meshopt content', async (t) => {
  const gltf = await load(GLB_MESHOPT_GEOMETRY_URL, [GLTFLoader], {
    gltf: {decompressMeshes: true, postProcess: false}
  });
  const gltfScenegraph = new GLTFScenegraph(gltf);
  t.ok(gltfScenegraph);
  t.deepEquals(gltfScenegraph.gltf.json.extensionsProcessed, ['EXT_meshopt_compression']);
  t.deepEquals(gltfScenegraph.gltf.json.extensionsUsed, ['KHR_mesh_quantization']);
  t.end();
});

test('GLTFScenegraph#should detect meshopt and ktx2 content', async (t) => {
  const gltf = await load(GLB_KTX2_GEOMETRY_URL, [GLTFLoader], {
    gltf: {decompressMeshes: false, postProcess: false}
  });
  const gltfScenegraph = new GLTFScenegraph(gltf);
  t.ok(gltfScenegraph);
  t.deepEquals(gltfScenegraph.gltf.json.extensionsProcessed, [
    'KHR_texture_basisu',
    'KHR_materials_unlit'
  ]);
  t.deepEquals(gltfScenegraph.gltf.json.extensionsUsed, []);
  t.end();
});

test('GLTFScenegraph#BufferView indices resolve correctly', async (t) => {
  const gltf = await load(GLB_TILE_WITH_DRACO_URL, [GLTFLoader, DracoLoader], {
    gltf: {decompressMeshes: true, postProcess: false}
  });

  const gltfScenegraph = new GLTFScenegraph(gltf);

  t.deepEquals(gltfScenegraph.gltf.json.extensionsProcessed, [
    'KHR_draco_mesh_compression',
    'KHR_materials_unlit'
  ]);
  t.deepEquals(gltfScenegraph.gltf.json.extensionsUsed, []);

  // @ts-expect-error
  t.equals(gltfScenegraph.json.bufferViews.length, 4, 'gltf bufferView count as expected');

  t.equals(
    gltfScenegraph.getTypedArrayForBufferView(0).byteOffset,
    2868,
    'first bufferView offset correct'
  );
  t.equals(
    gltfScenegraph.getTypedArrayForBufferView(1).byteOffset,
    70432,
    'second bufferView offset correct'
  );

  t.end();
});
