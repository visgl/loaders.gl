// loaders.gl
// SPDX-License-Identifier: MIT AND Apache-2.0
// Copyright vis.gl contributors

import {expect, test} from 'vitest';
import {Tile3DFeatureTable} from '@loaders.gl/3d-tiles';
import {GL} from '@math.gl/geometry-utils';
test('Tile3DFeatureTable#loads from JSON', () => {
  // @ts-expect-error
  const featureTable = new Tile3DFeatureTable({
    TEST: [0, 1, 2, 3, 4, 5]
  });
  featureTable.featuresLength = 3;
  const all = featureTable.getGlobalProperty('TEST', GL.UNSIGNED_BYTE);
  expect(all, 'getGlobalProperty(TEST)').toEqual([0, 1, 2, 3, 4, 5]);
  const feature = featureTable.getProperty('TEST', GL.UNSIGNED_BYTE, 2, 1, new Array(2));
  expect(feature, 'getProperty(TEST)').toEqual([2, 3]);
  const properties = featureTable.getPropertyArray('TEST', GL.UNSIGNED_BYTE, 2);
  expect(Array.from(properties), 'getPropertyArray(TEST)').toEqual([0, 1, 2, 3, 4, 5]);
});
test('Tile3DFeatureTable#loads from binary', () => {
  const featureTable = new Tile3DFeatureTable(
    {
      TEST: {
        byteOffset: 4
      }
    },
    new Uint8Array([0, 0, 0, 0, 0, 1, 2, 3, 4, 5])
  );
  featureTable.featuresLength = 3;
  const all = featureTable.getGlobalProperty('TEST', GL.UNSIGNED_BYTE, 6);
  expect(Array.from(all)).toEqual([0, 1, 2, 3, 4, 5]);
  const feature = featureTable.getProperty('TEST', GL.UNSIGNED_BYTE, 2, 1, new Array(2));
  expect(feature).toEqual([2, 3]);
  const properties = featureTable.getPropertyArray('TEST', GL.UNSIGNED_BYTE, 2);
  expect(Array.from(properties)).toEqual([0, 1, 2, 3, 4, 5]);
});
