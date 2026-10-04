// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
// @ts-expect-error
import {decodeExtensions} from '@loaders.gl/gltf/lib/api/gltf-extensions';
import {encode} from '../../../src/lib/extensions/deprecated/KHR_materials_unlit';
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

test('unlit encoding restores decoded annotations and keeps unrelated material data', () => {
  const input: any = {
    json: {
      asset: {version: '2.0'},
      extensionsUsed: ['EXT_other'],
      extensionsRequired: [],
      materials: [{unlit: true, extensions: {EXT_other: {enabled: true}}}, {name: 'lit'}]
    }
  };
  encode(input);
  encode(input);
  expect(input.json.materials).toEqual([
    {extensions: {EXT_other: {enabled: true}, KHR_materials_unlit: {}}},
    {name: 'lit'}
  ]);
  expect(input.json.extensionsUsed).toEqual(['EXT_other', 'KHR_materials_unlit']);
  expect(input.json.extensionsRequired).toEqual(['KHR_materials_unlit']);
  expect(input.json.extensions).toBeUndefined();
});

test('unlit encoding removes empty declarations without requiring existing optional unlit', () => {
  const input: any = {
    json: {
      asset: {version: '2.0'},
      extensionsUsed: ['KHR_materials_unlit'],
      extensionsRequired: [],
      materials: [{extensions: {KHR_materials_unlit: {}}}]
    }
  };
  encode(input);
  expect(input.json.extensionsUsed).toEqual(['KHR_materials_unlit']);
  expect(input.json.extensionsRequired).toBeUndefined();
  input.json.extensionsUsed = [];
  encode(input);
  expect(input.json.extensionsUsed).toBeUndefined();
});
