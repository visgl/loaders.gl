// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {parse} from '@loaders.gl/core';
import {Tiles3DLoader} from '@loaders.gl/3d-tiles';
import {createTilesetSpatialReference} from '@loaders.gl/tiles';
import {Matrix4} from '@math.gl/core';
import {parseGltf3DTile} from '../../../src/lib/parsers/parse-3d-tile-gltf';

/** Encodes two vertices and their normals in a self-contained JSON glTF. */
function createGltfContent(
  nodes: Record<string, unknown>[] = [{mesh: 0}],
  includeNormals = true
): ArrayBuffer {
  const values = new Float32Array([0, 0, 0, 1, 2, 3, 0, 0, 1, 0, 0, 1]);
  const bytes = new Uint8Array(values.buffer);
  const json = {
    asset: {version: '2.0'},
    buffers: [
      {
        byteLength: bytes.length,
        uri: `data:application/octet-stream;base64,${btoa(String.fromCharCode(...bytes))}`
      }
    ],
    bufferViews: [
      {buffer: 0, byteLength: 24},
      {buffer: 0, byteOffset: 24, byteLength: 24}
    ],
    accessors: [
      {bufferView: 0, componentType: 5126, count: 2, type: 'VEC3'},
      {bufferView: 1, componentType: 5126, count: 2, type: 'VEC3'}
    ],
    meshes: [
      {
        primitives: [
          {mode: 0, attributes: includeNormals ? {POSITION: 0, NORMAL: 1} : {POSITION: 0}}
        ]
      }
    ],
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
  includeNormals = true
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
  return await parse(createGltfContent(nodes, includeNormals), Tiles3DLoader, {
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
