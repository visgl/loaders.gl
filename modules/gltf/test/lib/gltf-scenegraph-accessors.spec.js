/* eslint-disable max-len */
import test from 'tape-promise/tape';

import {GLTFScenegraph} from '@loaders.gl/gltf';
import {GLTFLoader} from '@loaders.gl/gltf';
import {DracoLoader} from '@loaders.gl/draco';
import {load} from '@loaders.gl/core';

// Extracted from Cesium 3D Tiles
const GLB_TILE_WITH_DRACO_URL = '@loaders.gl/gltf/test/data/3d-tiles/143.glb';

test('GLTFScenegraph#ctor', t => {
  const gltfScenegraph = new GLTFScenegraph();
  t.ok(gltfScenegraph);
  t.end();
});

test('GLTFScenegraph#BufferView indices resolve correctly', async t => {
  const gltf = await load(GLB_TILE_WITH_DRACO_URL, [GLTFLoader, DracoLoader], {
    gltf: {decompressMeshes: false, postProcess: false}
  });

  const gltfScenegraph = new GLTFScenegraph(gltf);

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
