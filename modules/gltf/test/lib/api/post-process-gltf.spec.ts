/* eslint-disable max-len, camelcase */
import test from 'tape-promise/tape';

import type {GLTFWithBuffers} from '@loaders.gl/gltf';
import {postProcessGLTF} from '@loaders.gl/gltf';

const TEST_CASES = [
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
            {mesh: {id: 'mesh-0'}, id: 'node-0'},
            {mesh: {id: 'mesh-1'}, id: 'node-1'}
          ],
          id: 'scene-0'
        }
      ],
      nodes: [
        {mesh: {id: 'mesh-0'}, id: 'node-0'},
        {mesh: {id: 'mesh-1'}, id: 'node-1'}
      ],
      meshes: [{id: 'mesh-0'}, {id: 'mesh-1'}],
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
