/* eslint-disable max-len, camelcase */
import test from 'tape-promise/tape';

import type {GLTFWithBuffers, GLTFPostprocessed} from '@loaders.gl/gltf';
import {postProcessGLTF} from '@loaders.gl/gltf';

const TEST_CASES: {name: string; input: GLTFWithBuffers; output: GLTFPostprocessed}[] = [
  {
    name: 'Simple scene',
    input: {
      json: {
        scenes: [
          {
            nodes: [0, 1]
          }
        ],
        nodes: [{mesh: 0}, {mesh: 1}],
        meshes: [{}, {}],
        buffers: []
      }
    },
    output: {
      scenes: [
        {
          nodes: [
            {mesh: [Object], id: 'node-0'},
            {mesh: [Object], id: 'node-1'}
          ],
          sid: 'scene-0'
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

test('gltf#postProcessGLTF', (t) => {
  for (const testCase of TEST_CASES) {
    const json = postProcessGLTF(testCase.input as unknown as GLTFWithBuffers);
    t.deepEqual(json, testCase.output, testCase.name);
  }
  t.end();
});
