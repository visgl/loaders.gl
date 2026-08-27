// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
// @ts-expect-error
import {decodeExtensions} from '@loaders.gl/gltf/lib/api/gltf-extensions';
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
      extensionsRemoved: ['KHR_lights_punctual'],
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
test('gltf#KHR_lights_punctuals', async () => {
  for (const testCase of TEST_CASES) {
    await decodeExtensions(testCase.input);
    // Modifies input
    expect(testCase.input.json, testCase.name).toEqual(testCase.output);
  }
});
