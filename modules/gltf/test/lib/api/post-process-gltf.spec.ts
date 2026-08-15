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
