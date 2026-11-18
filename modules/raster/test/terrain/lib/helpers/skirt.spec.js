// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {addSkirt} from '../../../../src/terrain/lib/helpers/skirt';

function createAttributes() {
  return {
    POSITION: {value: new Float32Array([0, 0, 10, 1, 0, 20, 1, 1, 30, 0, 1, 40])},
    TEXCOORD_0: {value: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1])}
  };
}

function assertSkirt(attributes, indices) {
  const positions = attributes.POSITION.value;
  const textureCoordinates = attributes.TEXCOORD_0.value;
  expect(indices).toHaveLength(30);
  expect(Array.from(indices.slice(0, 6))).toEqual([0, 1, 2, 0, 2, 3]);
  expect(positions).toHaveLength(36);
  for (let i = 4; i < positions.length / 3; i++) {
    const x = positions[i * 3];
    const y = positions[i * 3 + 1];
    const source = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1]
    ].findIndex(([sx, sy]) => sx === x && sy === y);
    expect(source).toBeGreaterThanOrEqual(0);
    expect(positions[i * 3 + 2]).toBe((source + 1) * 10 - 5);
    expect(Array.from(textureCoordinates.slice(i * 2, i * 2 + 2))).toEqual([x, y]);
  }
}

test('addSkirt delegates boundary construction and copies texture coordinates', () => {
  const attributes = createAttributes();
  const result = addSkirt(attributes, new Uint16Array([0, 1, 2, 0, 2, 3]), 5);
  expect(result.triangles).toBeInstanceOf(Uint16Array);
  assertSkirt(attributes, result.triangles);
});

test('addSkirt supports quantized mesh side indices', () => {
  const attributes = createAttributes();
  const sides = {
    westIndices: [3, 0],
    northIndices: [2, 3],
    eastIndices: [2, 1],
    southIndices: [1, 0]
  };
  const result = addSkirt(attributes, new Uint16Array([0, 1, 2, 0, 2, 3]), 5, sides);
  assertSkirt(attributes, result.triangles);
  expect(sides.westIndices).toEqual([0, 3]);
  expect(sides.northIndices).toEqual([3, 2]);
  expect(sides.eastIndices).toEqual([2, 1]);
  expect(sides.southIndices).toEqual([1, 0]);
});

test('addSkirt preserves plain array triangle indices', () => {
  const attributes = createAttributes();
  const result = addSkirt(attributes, [0, 1, 2, 0, 2, 3], 5);
  expect(Array.isArray(result.triangles)).toBe(true);
  assertSkirt(attributes, result.triangles);
});
