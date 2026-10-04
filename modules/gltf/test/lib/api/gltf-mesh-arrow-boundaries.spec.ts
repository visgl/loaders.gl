// SPDX-License-Identifier: MIT

import {expect, test} from 'vitest';
import {convertGLTFToMeshArrow} from '../../../src/lib/api/gltf-mesh-arrow';
import type {GLTFWithBuffers} from '../../../src/lib/types/gltf-types';

/** Creates a one-row mesh with implicit-zero storage for focused conversion validation. */
function createMesh(): GLTFWithBuffers {
  return {
    json: {
      asset: {version: '2.0'},
      scenes: [{nodes: [0]}],
      nodes: [{mesh: 0}],
      accessors: [{componentType: 5126, type: 'SCALAR', count: 1}],
      meshes: [{primitives: [{attributes: {_VALUE: 0}}]}]
    },
    buffers: []
  };
}

test.each([
  ['cycle', (source: GLTFWithBuffers) => (source.json.nodes![0].children = [0]), 'cycle at node 0'],
  [
    'missing root',
    (source: GLTFWithBuffers) => (source.json.scenes![0].nodes = [9]),
    'missing node 9'
  ],
  ['missing mesh', (source: GLTFWithBuffers) => (source.json.nodes![0].mesh = 9), 'missing mesh 9'],
  [
    'missing accessor',
    (source: GLTFWithBuffers) => (source.json.meshes![0].primitives[0].attributes._VALUE = 9),
    'missing accessor 9'
  ],
  [
    'missing view',
    (source: GLTFWithBuffers) => (source.json.accessors![0].bufferView = 9),
    'missing buffer view 9'
  ],
  [
    'unsupported type',
    (source: GLTFWithBuffers) => (source.json.accessors![0].componentType = 5134),
    'not supported by Mesh Arrow'
  ],
  [
    'unsupported mode',
    (source: GLTFWithBuffers) => (source.json.meshes![0].primitives[0].mode = 99),
    'mode 99 is not supported'
  ]
] as const)('mesh projection rejects %s with an actionable path', (_name, mutate, message) => {
  const source = createMesh();
  mutate(source);
  expect(() => convertGLTFToMeshArrow(source)).toThrow(message);
});

test.each([
  [5120, Int8Array],
  [5122, Int16Array],
  [5124, Int32Array],
  [5125, Uint32Array]
] as const)('mesh projection materializes exact zero storage for component type %i', (componentType, ArrayType) => {
  const source = createMesh();
  source.json.accessors![0].componentType = componentType;
  const geometry = convertGLTFToMeshArrow(source).geometries[0];
  expect(geometry.materialized).toBe(true);
  expect(geometry.attributes._VALUE.value).toEqual(new ArrayType([0]));
  expect(geometry.table.data.numRows).toBe(1);
});

test.each([
  [1, 'line-list'],
  [2, 'line-loop'],
  [3, 'line-strip'],
  [5, 'triangle-strip'],
  [6, 'triangle-fan']
] as const)('mesh mode %i retains topology %s', (mode, topology) => {
  const source = createMesh();
  source.json.meshes![0].primitives[0].mode = mode;
  const table = convertGLTFToMeshArrow(source).geometries[0].table;
  expect(table.schema.metadata).toMatchObject({mode: String(mode)});
  expect(table.topology).toBe(topology);
});

test('an explicit empty scene stays empty while scene-less hierarchies infer roots', () => {
  const source = createMesh();
  source.json.scenes = [{}];
  expect(convertGLTFToMeshArrow(source)).toEqual({geometries: [], placements: []});
  delete source.json.scenes;
  source.json.nodes = [{children: [1]}, {mesh: 0}];
  const result = convertGLTFToMeshArrow(source);
  expect(result.placements[0].nodePath).toEqual([0, 1]);
  expect(result.geometries).toHaveLength(1);
  expect(convertGLTFToMeshArrow({json: {asset: {version: '2.0'}}, buffers: []})).toEqual({
    geometries: [],
    placements: []
  });
});

/** Creates one sparse substitution with independently bounded index and value views. */
function createSparseMesh(): GLTFWithBuffers {
  const source = createMesh();
  const bytes = new Uint8Array(8);
  new Float32Array(bytes.buffer, 4, 1)[0] = 42;
  source.buffers = [{arrayBuffer: bytes.buffer, byteOffset: 0, byteLength: 8}];
  source.json.bufferViews = [
    {buffer: 0, byteLength: 1},
    {buffer: 0, byteOffset: 4, byteLength: 4}
  ];
  source.json.accessors![0].sparse = {
    count: 1,
    indices: {bufferView: 0, componentType: 5121},
    values: {bufferView: 1}
  };
  return source;
}

test.each([
  [
    'indices view',
    (source: GLTFWithBuffers) => (source.json.accessors![0].sparse!.indices.bufferView = 9),
    'sparse indices reference missing buffer view 9'
  ],
  [
    'values view',
    (source: GLTFWithBuffers) => (source.json.accessors![0].sparse!.values.bufferView = 9),
    'sparse values reference missing buffer view 9'
  ],
  [
    'loaded buffer',
    (source: GLTFWithBuffers) => (source.buffers = []),
    'reference missing buffer 0'
  ],
  [
    'index view length',
    (source: GLTFWithBuffers) => (source.json.bufferViews![0].byteLength = 0),
    'sparse indices exceed buffer view 0'
  ],
  [
    'value view length',
    (source: GLTFWithBuffers) => (source.json.bufferViews![1].byteLength = 3),
    'sparse values exceed buffer view 1'
  ],
  [
    'sparse index range',
    (source: GLTFWithBuffers) => (new Uint8Array(source.buffers[0].arrayBuffer)[0] = 1),
    'sparse index is out of bounds'
  ]
] as const)('mesh sparse materialization validates %s', (_name, mutate, message) => {
  const source = createSparseMesh();
  mutate(source);
  expect(() => convertGLTFToMeshArrow(source)).toThrow(message);
});

test.each([
  'implicit-zero',
  'sparse'
] as const)('zero-copy policy identifies %s allocation', layout => {
  const source = layout === 'sparse' ? createSparseMesh() : createMesh();
  expect(() => convertGLTFToMeshArrow(source, {accessorLayout: 'zero-copy-only'})).toThrow(
    `${layout} and cannot be projected`
  );
});

test('sparse indices materialize independently from packed vertex attributes', () => {
  const source = createSparseMesh();
  source.json.accessors!.push({bufferView: 1, componentType: 5126, type: 'SCALAR', count: 1});
  source.json.meshes![0].primitives[0] = {attributes: {_VALUE: 1}, indices: 0};
  source.json.accessors![0].componentType = 5125;
  new Uint32Array(source.buffers[0].arrayBuffer, 4, 1)[0] = 0;
  const geometry = convertGLTFToMeshArrow(source).geometries[0];
  expect(geometry.materialized).toBe(true);
  expect(geometry.table.indices!.value).toEqual(new Uint32Array([0]));
});
