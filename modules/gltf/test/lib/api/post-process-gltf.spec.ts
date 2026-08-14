/* eslint-disable max-len, camelcase */
import test from 'test/utils/vitest-tape';

import type {GLTFWithBuffers, GLTFPostprocessed} from '@loaders.gl/gltf';
import {postProcessGLTF} from '@loaders.gl/gltf';

const TEST_CASES: {name: string; input: GLTFWithBuffers; output: Partial<GLTFPostprocessed>}[] = [
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

test('gltf#postProcessGLTF', t => {
  for (const testCase of TEST_CASES) {
    const json = postProcessGLTF(testCase.input as unknown as GLTFWithBuffers);
    t.deepEqual(json, testCase.output, testCase.name);
  }
  t.end();
});

test('gltf#postProcessGLTF resolves a draft glTF 2.1 thumbnail', t => {
  const json = postProcessGLTF({
    json: {
      asset: {version: '2.1', thumbnail: 0},
      images: [{uri: 'thumbnail.png'}]
    },
    buffers: [],
    images: [{width: 2, height: 2}]
  } as unknown as GLTFWithBuffers);

  t.equal(json.asset.thumbnail, json.images[0], 'resolves the thumbnail to the processed image');
  t.equal(json.asset.thumbnail?.image.width, 2, 'preserves the decoded thumbnail image');
  t.end();
});

test('gltf#postProcessGLTF normalizes indexed LINE_LOOP topology without mutating source data', t => {
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

  t.equal(primitive.mode, 1, 'converts LINE_LOOP to LINES');
  t.deepEqual(
    Array.from(primitive.indices?.value || []),
    [3, 1, 1, 4, 4, 2, 2, 3],
    'expands the loop into line-list indices'
  );
  t.equal(primitive.indices?.componentType, 5123, 'uses portable unsigned-short indices');
  t.equal(source.json.meshes?.[0].primitives[0].mode, 2, 'preserves the source primitive mode');
  t.equal(source.json.accessors?.[0].count, 4, 'preserves the source index accessor');
  t.deepEqual(Array.from(sourceIndices), [3, 1, 4, 2], 'preserves the source index buffer');
  t.end();
});

test('gltf#postProcessGLTF normalizes non-indexed TRIANGLE_FAN topology', t => {
  const json = postProcessGLTF({
    json: {
      asset: {version: '2.0'},
      accessors: [{componentType: 5126, count: 4, type: 'VEC3'}],
      meshes: [{primitives: [{attributes: {POSITION: 0}, mode: 6}]}]
    },
    buffers: []
  } as GLTFWithBuffers);
  const primitive = json.meshes[0].primitives[0];

  t.equal(primitive.mode, 4, 'converts TRIANGLE_FAN to TRIANGLES');
  t.deepEqual(
    Array.from(primitive.indices?.value || []),
    [0, 1, 2, 0, 2, 3],
    'expands the fan into triangle-list indices'
  );
  t.equal(primitive.indices?.count, 6, 'updates the generated index count');
  t.equal(primitive.indices?.max?.[0], 3, 'records the generated maximum index');
  t.end();
});
