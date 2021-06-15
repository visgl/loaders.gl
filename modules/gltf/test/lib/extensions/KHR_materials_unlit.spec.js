/* eslint-disable camelcase */
import test from 'tape-promise/tape';

import {decodeExtensions} from '@loaders.gl/gltf/lib/extensions/gltf-extensions';

const TEST_CASES = [
  {
    name: 'KHR_materials_unlit',
    input: {
      json: {
        extensionsUsed: ['KHR_materials_unlit'],
        extensions: {
          KHR_materials_unlit: {
            lights: [
              {
                color: [1.0, 1.0, 1.0],
                type: 'directional'
              }
            ]
          }
        },
        materials: [
          {
            extensions: {
              KHR_materials_unlit: {
                light: 0
              }
            }
          }
        ]
      }
    },
    output: {
      extensionsUsed: [],
      extensions: {},
      materials: [
        {
          extensions: {},
          unlit: true
        }
      ]
    }
  }
];

test('gltf#KHR_materials_unlit', async (t) => {
  for (const testCase of TEST_CASES) {
    await decodeExtensions(testCase.input);
    // Modifies input
    t.deepEqual(testCase.input.json, testCase.output, testCase.name);
  }
  t.end();
});
