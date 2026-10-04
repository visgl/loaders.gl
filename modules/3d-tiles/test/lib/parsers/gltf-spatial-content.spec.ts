// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {parse} from '@loaders.gl/core';
import {Tiles3DLoader} from '@loaders.gl/3d-tiles';
import {createTilesetSpatialReference} from '@loaders.gl/tiles';
import {Matrix4} from '@math.gl/core';
import {parseGltf3DTile} from '../../../src/lib/parsers/parse-3d-tile-gltf';

/** Compact variations of the self-contained glTF fixture. */
type GltfFixtureOptions = {
  /** Number of meshes with independent position and normal accessors. */
  meshCount?: number;
  /** Normal shared by the two vertices of each mesh. */
  normal?: number[];
  /** Optional animated TRS property on the first node. */
  animationPath?: 'translation' | 'scale';
};

/** Encodes two vertices and their normals in a self-contained JSON glTF. */
function createGltfContent(
  nodes: Record<string, unknown>[] = [{mesh: 0}],
  includeNormals = true,
  options: GltfFixtureOptions = {}
): ArrayBuffer {
  const meshCount = options.meshCount || 1;
  const normal = options.normal || [0, 0, 1];
  const values = new Float32Array(meshCount * 12 + (options.animationPath ? 8 : 0));
  for (let meshIndex = 0; meshIndex < meshCount; meshIndex++) {
    values.set([0, 0, 0, 1, 2, 3, ...normal, ...normal], meshIndex * 12);
  }
  if (options.animationPath) {
    values.set([0, 1, 10, 0, 7, 11, 0, 7], meshCount * 12);
  }
  const bytes = new Uint8Array(values.buffer);
  const bufferViews = Array.from({length: meshCount * 2}, (_, index) => ({
    buffer: 0,
    byteOffset: index * 24,
    byteLength: 24
  }));
  const accessors = bufferViews.map((_, index) => ({
    bufferView: index,
    componentType: 5126,
    count: 2,
    type: 'VEC3'
  }));
  if (options.animationPath) {
    bufferViews.push(
      {buffer: 0, byteOffset: meshCount * 48, byteLength: 8},
      {buffer: 0, byteOffset: meshCount * 48 + 8, byteLength: 24}
    );
    accessors.push(
      {bufferView: meshCount * 2, componentType: 5126, count: 2, type: 'SCALAR'},
      {bufferView: meshCount * 2 + 1, componentType: 5126, count: 2, type: 'VEC3'}
    );
  }
  const json = {
    asset: {version: '2.0'},
    buffers: [
      {
        byteLength: bytes.length,
        uri: `data:application/octet-stream;base64,${btoa(String.fromCharCode(...bytes))}`
      }
    ],
    bufferViews,
    accessors,
    meshes: Array.from({length: meshCount}, (_, index) => ({
      primitives: [
        {
          mode: 0,
          attributes: includeNormals
            ? {POSITION: index * 2, NORMAL: index * 2 + 1}
            : {POSITION: index * 2}
        }
      ]
    })),
    ...(options.animationPath
      ? {
          animations: [
            {
              channels: [{sampler: 0, target: {node: 0, path: options.animationPath}}],
              samplers: [{input: meshCount * 2, output: meshCount * 2 + 1}]
            }
          ]
        }
      : {}),
    nodes,
    scenes: [{nodes: nodes.map((_, index) => index)}],
    scene: 0
  };
  return new TextEncoder().encode(JSON.stringify(json)).buffer as ArrayBuffer;
}

/** Parses content through the public loader with a requested CRS and placement transform. */
async function parseSpatialContent(
  nodes: Record<string, unknown>[],
  spatialTransform?: number[],
  includeNormals = true,
  options: GltfFixtureOptions = {}
) {
  const spatialReference = createTilesetSpatialReference(
    {
      sourceCrs: 'EPSG:4326',
      coordinateFrame: 'geographic',
      axisOrder: 'xy',
      heightReference: 'ellipsoidal'
    },
    {targetCrs: 'EPSG:3857'}
  );
  return await parse(createGltfContent(nodes, includeNormals, options), Tiles3DLoader, {
    worker: false,
    '3d-tiles': {loadGLTF: true, _tilesetOptions: {spatialReference, spatialTransform}}
  });
}

test('3D Tiles transforms glTF positions, bounds, normals, and a unique node placement', async () => {
  const tile = await parseSpatialContent([{mesh: 0, translation: [10, 0, 7], scale: [2, 1, 1]}]);
  const attributes = tile.gltf.meshes[0].primitives[0].attributes;
  expect(attributes.POSITION.value[0]).toBeCloseTo(1113194.9, 0);
  expect(attributes.POSITION.value[3]).toBeCloseTo(1335833.875, 0);
  expect(attributes.POSITION.min).toEqual(Array.from(attributes.POSITION.value.slice(0, 3)));
  expect(attributes.POSITION.max).toEqual(Array.from(attributes.POSITION.value.slice(3, 6)));
  expect(Array.from(attributes.NORMAL.value)).toEqual([0, 0, 1, 0, 0, 1]);
  expect(Array.from(tile.gltf.nodes[0].matrix)).toEqual(Array.from(new Matrix4()));
  expect(tile.gltf.nodes[0].translation).toBeUndefined();
  expect(tile.gltf.nodes[0].scale).toBeUndefined();
});

test('3D Tiles composes explicit mesh and tile matrices before CRS conversion', async () => {
  const tile = await parseSpatialContent(
    [{mesh: 0, matrix: Array.from(new Matrix4().translate([2, 0, 4]))}],
    Array.from(new Matrix4().translate([3, 0, 5]))
  );
  const positions = tile.gltf.meshes[0].primitives[0].attributes.POSITION.value;
  expect(positions[0]).toBeCloseTo(556597.4375, 0);
  expect(positions[2]).toBe(9);
});

test.each([
  ['shared mesh', [{mesh: 0}, {mesh: 0}]],
  ['nested mesh', [{children: [1]}, {mesh: 0}]],
  ['unreferenced mesh', []]
])('3D Tiles transforms %s without consuming ambiguous node placement', async (_name, nodes) => {
  const tile = await parseSpatialContent(nodes, undefined, false);
  const positions = tile.gltf.meshes[0].primitives[0].attributes.POSITION.value;
  expect(positions[0]).toBe(0);
  expect(positions[3]).toBeCloseTo(111319.49, 0);
  expect(positions[5]).toBe(3);
});

test.each([
  ['shared', [{mesh: 0, translation: [10, 0, 7]}, {mesh: 1}, {mesh: 1}]],
  ['nested', [{mesh: 0, translation: [10, 0, 7]}, {children: [2]}, {mesh: 1}]],
  ['unreferenced', [{mesh: 0, translation: [10, 0, 7]}]]
])('3D Tiles transforms a %s mesh alongside a uniquely placed mesh', async (_name, nodes) => {
  const tile = await parseSpatialContent(nodes, undefined, false, {meshCount: 2});
  const first = tile.gltf.meshes[0].primitives[0].attributes.POSITION;
  const second = tile.gltf.meshes[1].primitives[0].attributes.POSITION;
  expect(first.value[0]).toBeCloseTo(1113194.9, 0);
  expect(second.value[3]).toBeCloseTo(111319.49, 0);
  expect(second.max).toEqual(Array.from(second.value.slice(3, 6)));
});

test.each([
  'translation',
  'scale'
] as const)('3D Tiles preserves a node targeted by %s animation instead of baking its authored TRS', async animationPath => {
  const tile = await parseSpatialContent(
    [{mesh: 0, translation: [10, 0, 7], scale: [2, 1, 1]}],
    undefined,
    false,
    {animationPath}
  );
  const positions = tile.gltf.meshes[0].primitives[0].attributes.POSITION.value;
  expect(positions[0]).toBe(0);
  expect(positions[3]).toBeCloseTo(111319.49, 0);
  expect(tile.gltf.nodes[0].translation).toEqual([10, 0, 7]);
  expect(tile.gltf.nodes[0].scale).toEqual([2, 1, 1]);
  expect(tile.gltf.animations[0].channels[0].target).toEqual({node: 0, path: animationPath});
});

test.each([
  [
    'non-uniform scale',
    {mesh: 0, scale: [2, 1, 1]},
    [1, 1, 0],
    [1 / Math.sqrt(5), 2 / Math.sqrt(5), 0]
  ],
  [
    'shear',
    {mesh: 0, matrix: [1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]},
    [1, 0, 0],
    [Math.SQRT1_2, -Math.SQRT1_2, 0]
  ]
])('3D Tiles uses inverse-transpose normals for %s placements', async (_name, node, normal, expected) => {
  const tile = await parseSpatialContent([node], undefined, true, {normal});
  const normals = tile.gltf.meshes[0].primitives[0].attributes.NORMAL.value;
  for (let axis = 0; axis < 3; axis++) {
    expect(normals[axis]).toBeCloseTo(expected[axis], 5);
  }
});

test('3D Tiles uses inverse-transpose normals for non-uniform tile transforms', async () => {
  const tile = await parseSpatialContent(
    [{mesh: 0}],
    Array.from(new Matrix4().scale([2, 1, 1])),
    true,
    {normal: [1, 1, 0]}
  );
  const normals = tile.gltf.meshes[0].primitives[0].attributes.NORMAL.value;
  expect(normals[0]).toBeCloseTo(1 / Math.sqrt(5), 5);
  expect(normals[1]).toBeCloseTo(2 / Math.sqrt(5), 5);
});

test('3D Tiles keeps deferred bytes and handles parser calls without a context', async () => {
  const bytes = new ArrayBuffer(12);
  const deferred = {} as any;
  expect(
    await parseGltf3DTile(deferred, bytes, {'3d-tiles': {loadGLTF: false, assetGltfUpAxis: 'Z'}})
  ).toBe(12);
  expect(deferred.gltfArrayBuffer).toBe(bytes);
  expect(deferred.gltfUpAxis).toBe('Z');
  const noContext = {} as any;
  expect(await parseGltf3DTile(noContext, bytes, {'3d-tiles': {loadGLTF: true}})).toBe(12);
  expect(noContext.gltf).toBeUndefined();
});
