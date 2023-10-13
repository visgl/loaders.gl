/* eslint-disable max-len */
import test from 'tape-promise/tape';

import {GLTFScenegraph} from '@loaders.gl/gltf';
import {GLTFLoader} from '@loaders.gl/gltf';
import {load} from '@loaders.gl/core';

// Extracted from Cesium 3D Tiles
const GLB_TILE_WITH_DRACO_URL = '@loaders.gl/gltf/test/data/3d-tiles/143.glb';

const GLB_MESHOPT_GEOMETRY_URL = '@loaders.gl/gltf/test/data/meshopt/pirate.glb';
const GLB_KTX2_GEOMETRY_URL = '@loaders.gl/3d-tiles/test/data/VNext/agi-ktx2/0/0.glb';

test('GLTFScenegraph#ctor', (t) => {
  const gltfScenegraph = new GLTFScenegraph();
  t.ok(gltfScenegraph);
  t.end();
});

test('GLTFScenegraph#should detect meshopt content', async (t) => {
  const gltf = await load(GLB_MESHOPT_GEOMETRY_URL, GLTFLoader, {
    gltf: {decompressMeshes: true}
  });
  const gltfScenegraph = new GLTFScenegraph(gltf);
  t.ok(gltfScenegraph);
  t.deepEquals(
    gltfScenegraph.getRemovedExtensions(),
    ['EXT_meshopt_compression'],
    'removedExtions === meshopt'
  );
  t.deepEquals(
    gltfScenegraph.getUsedExtensions(),
    ['KHR_mesh_quantization'],
    'usedExtensions no longer contain meshopt'
  );
  t.end();
});

test('GLTFScenegraph#should detect meshopt and ktx2 content', async (t) => {
  const gltf = await load(GLB_KTX2_GEOMETRY_URL, GLTFLoader, {
    gltf: {decompressMeshes: false}
  });
  const gltfScenegraph = new GLTFScenegraph(gltf);
  t.ok(gltfScenegraph);
  t.deepEquals(gltfScenegraph.getRemovedExtensions(), [
    'KHR_texture_basisu',
    'KHR_materials_unlit'
  ]);
  t.deepEquals(gltfScenegraph.gltf.json.extensionsUsed, []);
  t.end();
});

test('GLTFScenegraph#BufferView indices resolve correctly', async (t) => {
  const gltf = await load(GLB_TILE_WITH_DRACO_URL, GLTFLoader, {
    gltf: {decompressMeshes: true}
  });

  const gltfScenegraph = new GLTFScenegraph(gltf);

  t.deepEquals(gltfScenegraph.getRemovedExtensions(), [
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

test('GLTFScenegraph#Typed Arrays sgould be taken by Accessor', async (t) => {
  const GLB_ACCESSOR_URL = '@loaders.gl/gltf/test/data/glb/DamagedHelmet.glb';
  const data = [
    {
      accessorIndex: 0,
      accessorCountExpected: 46356,
      arrayExpected: [0, 1, 2, 2, 3, 0, 3, 2]
    },
    {
      accessorIndex: 1,
      accessorCountExpected: 14556,
      arrayExpected: [
        -0.6119945645332336, -0.03094087541103363, 0.48309004306793213, -0.5795046091079712,
        0.05627411603927612, 0.5217580199241638, -0.5735836029052734, 0.06353411078453064
      ]
    }
  ];
  const gltfWithBuffers = await load(GLB_ACCESSOR_URL, GLTFLoader);
  const gltfScenegraph = new GLTFScenegraph(gltfWithBuffers);

  let accessor;
  for (const d of data) {
    let typedArray;
    typedArray = gltfScenegraph.getTypedArrayForAccessor(d.accessorIndex);
    t.deepEquals(
      typedArray.slice(0, 8),
      d.arrayExpected,
      'typed array taken by accessor as a number'
    );

    accessor = gltfScenegraph.getAccessor(d.accessorIndex);
    t.equals(accessor.count, d.accessorCountExpected, 'first accessor taken');

    typedArray = gltfScenegraph.getTypedArrayForAccessor(accessor);
    t.deepEquals(
      typedArray.slice(0, 8),
      d.arrayExpected,
      'typed array taken by accessor as an object'
    );

    if (accessor.bufferView === 0) {
      accessor.bufferView = undefined;
      // default bufferView should be 0
      typedArray = gltfScenegraph.getTypedArrayForAccessor(accessor);
      t.deepEquals(
        typedArray.slice(0, 8),
        d.arrayExpected,
        'typed array taken by accessor as object with the bufferView set to undefined'
      );
    }
  }
  t.end();
});
