// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import type {GLTFWithBuffers, GLTFPostprocessed} from '@loaders.gl/gltf';
import {postProcessGLTF} from '@loaders.gl/gltf';
const TEST_CASES: {
  name: string;
  input: GLTFWithBuffers;
  output: Partial<GLTFPostprocessed>;
}[] = [
  {
    name: 'Simple scene',
    input: {
      json: {
        asset: {version: '2.0'},
        scenes: [
          {
            nodes: [0, 1]
          }
        ],
        nodes: [{mesh: 0}, {mesh: 1}],
        meshes: [{primitives: []}, {primitives: []}],
        buffers: []
      },
      buffers: []
    },
    output: {
      asset: {version: '2.0'},
      scenes: [
        {
          nodes: [
            {mesh: {id: 'mesh-0', primitives: []}, id: 'node-0'},
            {mesh: {id: 'mesh-1', primitives: []}, id: 'node-1'}
          ],
          id: 'scene-0'
        }
      ],
      nodes: [
        {mesh: {id: 'mesh-0', primitives: []}, id: 'node-0'},
        {mesh: {id: 'mesh-1', primitives: []}, id: 'node-1'}
      ],
      meshes: [
        {id: 'mesh-0', primitives: []},
        {id: 'mesh-1', primitives: []}
      ],
      buffers: []
    }
  }
];
test('gltf#postProcessGLTF', () => {
  for (const testCase of TEST_CASES) {
    const json = postProcessGLTF(testCase.input as unknown as GLTFWithBuffers);
    expect(json, testCase.name).toEqual(testCase.output);
  }
});
test('gltf#postProcessGLTF resolves a draft glTF 2.1 thumbnail', () => {
  const json = postProcessGLTF({
    json: {
      asset: {version: '2.1', thumbnail: 0},
      images: [{uri: 'thumbnail.png'}]
    },
    buffers: [],
    images: [{width: 2, height: 2}]
  } as unknown as GLTFWithBuffers);
  expect(json.asset.thumbnail, 'resolves the thumbnail to the processed image').toBe(
    json.images[0]
  );
  expect(json.asset.thumbnail?.image.width, 'preserves the decoded thumbnail image').toBe(2);
});
test('gltf#postProcessGLTF normalizes indexed LINE_LOOP topology without mutating source data', () => {
  const sourceIndices = new Uint16Array([3, 1, 4, 2]);
  const source = {
    json: {
      asset: {version: '2.0'},
      buffers: [{byteLength: sourceIndices.byteLength}],
      bufferViews: [{buffer: 0, byteLength: sourceIndices.byteLength}],
      accessors: [
        {bufferView: 0, componentType: 5123, count: sourceIndices.length, type: 'SCALAR'},
        {componentType: 5126, count: 5, type: 'VEC3'}
      ],
      meshes: [{primitives: [{attributes: {POSITION: 1}, indices: 0, mode: 2}]}]
    },
    buffers: [
      {
        arrayBuffer: sourceIndices.buffer,
        byteOffset: 0,
        byteLength: sourceIndices.byteLength
      }
    ]
  } as GLTFWithBuffers;
  const json = postProcessGLTF(source);
  const primitive = json.meshes[0].primitives[0];
  expect(primitive.mode, 'converts LINE_LOOP to LINES').toBe(1);
  expect(
    Array.from(primitive.indices?.value || []),
    'expands the loop into line-list indices'
  ).toEqual([3, 1, 1, 4, 4, 2, 2, 3]);
  expect(primitive.indices?.componentType, 'uses portable unsigned-short indices').toBe(5123);
  expect(source.json.meshes?.[0].primitives[0].mode, 'preserves the source primitive mode').toBe(2);
  expect(source.json.accessors?.[0].count, 'preserves the source index accessor').toBe(4);
  expect(Array.from(sourceIndices), 'preserves the source index buffer').toEqual([3, 1, 4, 2]);
});
test('gltf#postProcessGLTF normalizes non-indexed TRIANGLE_FAN topology', () => {
  const json = postProcessGLTF({
    json: {
      asset: {version: '2.0'},
      accessors: [{componentType: 5126, count: 4, type: 'VEC3'}],
      meshes: [{primitives: [{attributes: {POSITION: 0}, mode: 6}]}]
    },
    buffers: []
  } as GLTFWithBuffers);
  const primitive = json.meshes[0].primitives[0];
  expect(primitive.mode, 'converts TRIANGLE_FAN to TRIANGLES').toBe(4);
  expect(
    Array.from(primitive.indices?.value || []),
    'expands the fan into triangle-list indices'
  ).toEqual([0, 1, 2, 0, 2, 3]);
  expect(primitive.indices?.count, 'updates the generated index count').toBe(6);
  expect(primitive.indices?.max?.[0], 'records the generated maximum index').toBe(3);
});
test('gltf#postProcessGLTF materializes an implicit-zero index accessor', () => {
  const json = postProcessGLTF({
    json: {
      asset: {version: '2.0'},
      accessors: [
        {componentType: 5123, count: 3, type: 'SCALAR'},
        {componentType: 5126, count: 1, type: 'VEC3'}
      ],
      meshes: [{primitives: [{attributes: {POSITION: 1}, indices: 0, mode: 2}]}]
    },
    buffers: []
  } as GLTFWithBuffers);
  const primitive = json.meshes[0].primitives[0];
  expect(primitive.mode, 'converts LINE_LOOP to LINES').toBe(1);
  expect(
    Array.from(primitive.indices?.value || []),
    'uses the accessor implicit-zero values'
  ).toEqual([0, 0, 0, 0, 0, 0]);
});
test('gltf#postProcessGLTF applies sparse-only index accessor substitutions', () => {
  const sparseData = new Uint8Array([1, 3, 5, 0, 2, 0]);
  const json = postProcessGLTF({
    json: {
      asset: {version: '2.0'},
      buffers: [{byteLength: sparseData.byteLength}],
      bufferViews: [
        {buffer: 0, byteOffset: 0, byteLength: 2},
        {buffer: 0, byteOffset: 2, byteLength: 4}
      ],
      accessors: [
        {
          componentType: 5123,
          count: 4,
          type: 'SCALAR',
          sparse: {
            count: 2,
            indices: {bufferView: 0, componentType: 5121},
            values: {bufferView: 1}
          }
        },
        {componentType: 5126, count: 6, type: 'VEC3'}
      ],
      meshes: [{primitives: [{attributes: {POSITION: 1}, indices: 0, mode: 2}]}]
    },
    buffers: [{arrayBuffer: sparseData.buffer, byteOffset: 0, byteLength: sparseData.byteLength}]
  } as GLTFWithBuffers);
  const primitive = json.meshes[0].primitives[0];
  expect(primitive.mode, 'converts LINE_LOOP to LINES').toBe(1);
  expect(
    Array.from(primitive.indices?.value || []),
    'applies sparse substitutions to the implicit-zero base'
  ).toEqual([0, 5, 5, 0, 0, 2, 2, 0]);
});
