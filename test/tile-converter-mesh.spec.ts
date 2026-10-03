// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {parse} from '@loaders.gl/core';
import {GLBLoader, GLTFLoader, GLTFScenegraph} from '@loaders.gl/gltf';
import {GLTF2Schema} from '@loaders.gl/gltf/schema';
import type {MeshAttribute, MeshGeometry} from '@loaders.gl/schema';
import {encodeMeshTile, TileConversionError} from '@loaders.gl/tile-converter/v5';
import {encodeMeshTile as encodeBrowserMeshTile} from '@loaders.gl/tile-converter/v5/browser';

/** Creates the smallest unindexed triangle in a local coordinate frame. */
function createMesh(): MeshGeometry {
  return {
    topology: 'triangle-list',
    mode: 4,
    attributes: {POSITION: {value: new Float32Array([10, 20, 30, 11, 20, 30, 10, 21, 30]), size: 3}}
  };
}

test.each([
  undefined,
  Uint8Array,
  Uint16Array,
  Uint32Array
])('mesh encoder emits valid GLB and preserves geometry with indices %s', async IndexArray => {
  const mesh = createMesh();
  if (IndexArray) mesh.indices = {value: new IndexArray([0, 1, 2]), size: 1};
  const output = encodeMeshTile(mesh);
  const container = await parse(output, GLBLoader, {glb: {strict: true}});
  const validation = GLTF2Schema.safeParse(container.json);
  expect(validation.success, validation.error?.message).toBe(true);
  expect(container.version).toBe(2);
  expect(container.json.scene).toBe(0);
  expect(container.json.scenes).toEqual([{nodes: [0]}]);
  expect(container.json.nodes).toEqual([{mesh: 0}]);
  expect(container.json.buffers).toEqual([{byteLength: container.binChunks[0].byteLength}]);
  expect(container.json.accessors[0]).toMatchObject({
    type: 'VEC3',
    componentType: 5126,
    count: 3,
    min: [10, 20, 30],
    max: [11, 21, 30]
  });
  const scenegraph = new GLTFScenegraph(
    await parse(output, GLTFLoader, {gltf: {postProcess: false}})
  );
  expect(Array.from(scenegraph.getTypedArrayForAccessor(0))).toEqual(
    Array.from(mesh.attributes.POSITION.value)
  );
  const primitive = container.json.meshes[0].primitives[0];
  expect(primitive.mode).toBe(4);
  expect(primitive.material).toBeUndefined();
  if (IndexArray) {
    expect(Array.from(scenegraph.getTypedArrayForAccessor(primitive.indices))).toEqual([0, 1, 2]);
    expect(scenegraph.getTypedArrayForAccessor(primitive.indices)).toBeInstanceOf(IndexArray);
  } else {
    expect(primitive.indices).toBeUndefined();
  }
});

test('mesh encoder preserves normals and typed array subviews without changing input storage', async () => {
  const positionStorage = new Float32Array([999, ...createMesh().attributes.POSITION.value, 999]);
  const normalStorage = new Float32Array([999, 0, 0, 1, 0, 0, 1, 0, 0, 1, 999]);
  const indexStorage = new Uint16Array([999, 0, 1, 2, 999]);
  const before = [positionStorage.slice(), normalStorage.slice(), indexStorage.slice()];
  const mesh = createMesh();
  mesh.attributes.POSITION = {
    value: positionStorage.subarray(1, 10),
    size: 3,
    byteOffset: 0,
    byteStride: 0,
    normalized: false
  };
  mesh.attributes.NORMAL = {value: normalStorage.subarray(1, 10), size: 3};
  mesh.indices = {value: indexStorage.subarray(1, 4), size: 1};
  const output = encodeMeshTile(mesh);
  const scenegraph = new GLTFScenegraph(
    await parse(output, GLTFLoader, {gltf: {postProcess: false}})
  );
  expect(Array.from(scenegraph.getTypedArrayForAccessor(0))).toEqual(
    Array.from(positionStorage.subarray(1, 10))
  );
  expect(Array.from(scenegraph.getTypedArrayForAccessor(1))).toEqual([0, 0, 1, 0, 0, 1, 0, 0, 1]);
  expect(Array.from(scenegraph.getTypedArrayForAccessor(2))).toEqual([0, 1, 2]);
  expect([positionStorage, normalStorage, indexStorage]).toEqual(before);
});

test('mesh encoder is shared by the browser entrypoint', () => {
  expect(encodeBrowserMeshTile).toBe(encodeMeshTile);
});

test.each([
  [
    'topology',
    (mesh: MeshGeometry) => {
      mesh.topology = 'triangle-strip';
    },
    'MESH_TOPOLOGY_UNSUPPORTED'
  ],
  [
    'mode',
    (mesh: MeshGeometry) => {
      mesh.mode = 5;
    },
    'MESH_TOPOLOGY_UNSUPPORTED'
  ],
  [
    'unknown attribute',
    (mesh: MeshGeometry) => {
      mesh.attributes.COLOR_0 = {value: new Uint8Array(9), size: 3};
    },
    'MESH_ATTRIBUTE_UNSUPPORTED'
  ],
  [
    'missing positions',
    (mesh: MeshGeometry) => {
      delete mesh.attributes.POSITION;
    },
    'MESH_ATTRIBUTE_INVALID'
  ],
  [
    'position type',
    (mesh: MeshGeometry) => {
      mesh.attributes.POSITION.value = new Float64Array(9);
    },
    'MESH_ATTRIBUTE_INVALID'
  ],
  [
    'position size',
    (mesh: MeshGeometry) => {
      mesh.attributes.POSITION.size = 2;
    },
    'MESH_ATTRIBUTE_INVALID'
  ],
  [
    'empty positions',
    (mesh: MeshGeometry) => {
      mesh.attributes.POSITION.value = new Float32Array();
    },
    'MESH_ATTRIBUTE_INVALID'
  ],
  [
    'partial xyz',
    (mesh: MeshGeometry) => {
      mesh.attributes.POSITION.value = new Float32Array(8);
    },
    'MESH_ATTRIBUTE_INVALID'
  ],
  [
    'nonfinite positions',
    (mesh: MeshGeometry) => {
      mesh.attributes.POSITION.value[0] = NaN;
    },
    'MESH_ATTRIBUTE_NONFINITE'
  ],
  [
    'partial triangle',
    (mesh: MeshGeometry) => {
      mesh.attributes.POSITION.value = new Float32Array(6);
    },
    'MESH_TRIANGLE_COUNT_INVALID'
  ],
  [
    'normal count',
    (mesh: MeshGeometry) => {
      mesh.attributes.NORMAL = {value: new Float32Array([0, 0, 1]), size: 3};
    },
    'MESH_NORMAL_COUNT_MISMATCH'
  ],
  [
    'normal length',
    (mesh: MeshGeometry) => {
      mesh.attributes.NORMAL = {value: new Float32Array(9), size: 3};
    },
    'MESH_NORMAL_INVALID'
  ],
  [
    'index type',
    (mesh: MeshGeometry) => {
      mesh.indices = {value: new Int16Array([0, 1, 2]), size: 1};
    },
    'MESH_INDICES_INVALID'
  ],
  [
    'index size',
    (mesh: MeshGeometry) => {
      mesh.indices = {value: new Uint8Array([0, 1, 2]), size: 3};
    },
    'MESH_INDICES_INVALID'
  ],
  [
    'empty indices',
    (mesh: MeshGeometry) => {
      mesh.indices = {value: new Uint8Array(), size: 1};
    },
    'MESH_TRIANGLE_COUNT_INVALID'
  ],
  [
    'partial indices',
    (mesh: MeshGeometry) => {
      mesh.indices = {value: new Uint8Array([0, 1]), size: 1};
    },
    'MESH_TRIANGLE_COUNT_INVALID'
  ],
  [
    'index range',
    (mesh: MeshGeometry) => {
      mesh.indices = {value: new Uint8Array([0, 1, 3]), size: 1};
    },
    'MESH_INDEX_OUT_OF_RANGE'
  ]
])('mesh encoder rejects %s with a typed diagnostic', (_name, change, code) => {
  const mesh = createMesh();
  change(mesh);
  expect(() => encodeMeshTile(mesh)).toThrow(TileConversionError);
  expect(() => encodeMeshTile(mesh)).toThrow(expect.objectContaining({code}));
});

test.each([
  {byteOffset: 4},
  {byteStride: 12},
  {normalized: true},
  {componentType: 'float16' as const},
  {transform: {type: 'quantization' as const, bits: 16, origin: [0, 0, 0], range: 1}}
])('mesh encoder rejects unsupported descriptor %j for vertices and indices', layout => {
  for (const name of ['POSITION', 'NORMAL', 'indices']) {
    const mesh = createMesh();
    const attribute: MeshAttribute =
      name === 'indices'
        ? {value: new Uint8Array([0, 1, 2]), size: 1, ...layout}
        : {value: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]), size: 3, ...layout};
    if (name === 'indices') mesh.indices = attribute;
    else mesh.attributes[name] = attribute;
    expect(() => encodeMeshTile(mesh)).toThrow(
      expect.objectContaining({code: 'MESH_ATTRIBUTE_LAYOUT_UNSUPPORTED'})
    );
  }
});

test('mesh encoder rejects primitive restart even when it is below vertex count', () => {
  const mesh = createMesh();
  mesh.attributes.POSITION.value = new Float32Array(256 * 3);
  mesh.indices = {value: new Uint8Array([0, 1, 255]), size: 1};
  expect(() => encodeMeshTile(mesh)).toThrow(
    expect.objectContaining({code: 'MESH_INDEX_OUT_OF_RANGE'})
  );
});
