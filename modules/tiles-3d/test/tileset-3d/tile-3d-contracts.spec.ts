// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {getTile3DFeatureIdSets} from '../../src/tileset-3d/common/tile-3d-contracts';

test('getTile3DFeatureIdSets extracts declarations from decoded glTF primitives', () => {
  const payload = {
    meshes: [
      {
        primitives: [
          {
            extensions: {
              EXT_mesh_features: {
                featureIds: [
                  {attribute: '_FEATURE_ID_0'},
                  {propertyTable: 2},
                  {texture: {index: 1}},
                  {implicit: {propertyTable: 3}},
                  {constant: 7}
                ]
              }
            }
          }
        ]
      }
    ]
  };
  const featureIdSets = getTile3DFeatureIdSets(payload);
  expect(featureIdSets.map(featureIdSet => featureIdSet.source)).toEqual([
    'attribute',
    'property-table',
    'texture',
    'implicit',
    'constant'
  ]);
  expect(featureIdSets[0].attribute).toBe('_FEATURE_ID_0');
  expect(featureIdSets[1].propertyTable).toBe(2);
  expect(featureIdSets[2].texture).toEqual({index: 1});
  expect(featureIdSets[4].constant).toBe(7);
  expect(featureIdSets[0].details).toBeTruthy();
});
