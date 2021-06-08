/* eslint-disable camelcase */
import test from 'tape-promise/tape';

import {decodeExtensions} from '@loaders.gl/gltf/lib/extensions/gltf-extensions.js';

const TEST_CASES = [
  {
    name: 'KHR_lights_punctual',
    input: {
      json: {
        extensionsUsed: ['KHR_lights_punctual'],
        extensions: {
          KHR_lights_punctual: {
            lights: [
              {
                color: [1.0, 1.0, 1.0],
                type: 'directional'
              }
            ]
          }
        },
        nodes: [
          {
            extensions: {
              KHR_lights_punctual: {
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
      nodes: [
        {
          extensions: {},
          light: 0
        }
      ],
      lights: [
        {
          color: [1.0, 1.0, 1.0],
          type: 'directional'
        }
      ]
    }
  }
];

test('gltf#KHR_lights_punctuals', async (t) => {
  for (const testCase of TEST_CASES) {
    await decodeExtensions(testCase.input);
    // Modifies input
    t.deepEqual(testCase.input.json, testCase.output, testCase.name);
  }
  t.end();
});
