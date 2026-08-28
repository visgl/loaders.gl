// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';

import {addSkirt} from '../../../src/lib/helpers/skirt';

test('TerrainLoader-skirting#addSkirt finds border edges from triangles', () => {
  const attributes = {
    POSITION: {
      value: new Float32Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
    },
    TEXCOORD_0: {
      value: new Float32Array([1, 2, 3, 4, 5, 6, 7, 8])
    }
  };
  const triangles = new Uint16Array([0, 1, 2, 0, 2, 3]);
  const addSkirtResult = addSkirt(attributes, triangles, 20);
  expect(Array.from(attributes.POSITION.value)).toEqual([
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, -17, 4, 5, -14, 10, 11, -8, 1, 2, -17, 4, 5, -14,
    7, 8, -11, 7, 8, -11, 10, 11, -8
  ]);
  expect(Array.from(attributes.TEXCOORD_0.value)).toEqual([
    1, 2, 3, 4, 5, 6, 7, 8, 1, 2, 3, 4, 7, 8, 1, 2, 3, 4, 5, 6, 5, 6, 7, 8
  ]);
  expect(Array.from(addSkirtResult.triangles)).toEqual([
    0, 1, 2, 0, 2, 3, 0, 5, 1, 5, 0, 4, 3, 7, 0, 7, 3, 6, 1, 9, 2, 9, 1, 8, 2, 11, 3, 11, 2, 10
  ]);
});

test('TerrainLoader-skirting#addSkirt uses quantized mesh edge indices', () => {
  const attributes = {
    POSITION: {value: new Float32Array([0, 0, 10, 1, 0, 20, 1, 1, 30, 0, 1, 40])},
    TEXCOORD_0: {value: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1])}
  };
  const outsideIndices = {
    westIndices: [3, 0],
    northIndices: [2, 3],
    eastIndices: [2, 1],
    southIndices: [1, 0]
  };

  const result = addSkirt(attributes, new Uint16Array([0, 1, 2, 0, 2, 3]), 5, outsideIndices);

  expect(outsideIndices.westIndices).toEqual([0, 3]);
  expect(outsideIndices.northIndices).toEqual([3, 2]);
  expect(outsideIndices.eastIndices).toEqual([2, 1]);
  expect(outsideIndices.southIndices).toEqual([1, 0]);
  expect(result.triangles).toBeInstanceOf(Uint16Array);
  expect(result.triangles.length).toBe(30);
  expect(Array.from(attributes.POSITION.value.slice(-12))).toEqual([
    1, 1, 25, 1, 0, 15, 1, 0, 15, 0, 0, 5
  ]);
});

test('TerrainLoader-skirting#addSkirt preserves plain array triangle indices', () => {
  const attributes = {
    POSITION: {value: new Float32Array([0, 0, 10, 1, 0, 20, 0, 1, 30])},
    TEXCOORD_0: {value: new Float32Array([0, 0, 1, 0, 0, 1])}
  };

  const result = addSkirt(attributes, [0, 1, 2], 2);

  expect(Array.isArray(result.triangles)).toBe(true);
  expect(result.triangles.slice(0, 3)).toEqual([0, 1, 2]);
  expect(result.triangles).toHaveLength(21);
});
