// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
// @ts-expect-error
import {decodeExtensions} from '@loaders.gl/gltf/lib/api/gltf-extensions';
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
      extensionsRemoved: ['KHR_materials_unlit'],
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
test('gltf#KHR_materials_unlit', async () => {
  for (const testCase of TEST_CASES) {
    await decodeExtensions(testCase.input);
    // Modifies input
    expect(testCase.input.json, testCase.name).toEqual(testCase.output);
  }
});
