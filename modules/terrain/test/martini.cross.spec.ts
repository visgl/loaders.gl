// SPDX-License-Identifier: MIT
import {expect, test} from 'vitest';
import ReferenceMartini from '@mapbox/martini';
import Martini from '../src/libs/martini.mjs';

test.each([
  3, 5, 9
])('vendored Martini preserves vertices and triangle indices for a %s grid', gridSize => {
  const elevations = Float32Array.from(
    {length: gridSize * gridSize},
    (_, index) => ((index * 13) % 17) - 8
  );
  const tile = new Martini(gridSize).createTile(elevations);
  const reference = new ReferenceMartini(gridSize).createTile(elevations);
  for (const maximumError of [0, 1, 10]) {
    expect(tile.getMesh(maximumError)).toEqual(reference.getMesh(maximumError));
  }
});
