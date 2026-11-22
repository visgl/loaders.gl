// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {hasSameDracoPositions} from '../apps/tile-converter/src/v5/mesh-draco-positions';

test('Draco position verification accepts reordered and duplicate positions in typed-array views', () => {
  const source = new Float32Array([99, -0, 1, 2, 3, 4, 5, 6, 7, 8]).subarray(1);
  const decoded = new Float32Array([99, 3, 4, 5, 0, 1, 2, 3, 4, 5]).subarray(1);
  expect(hasSameDracoPositions(source, decoded)).toBe(true);
  decoded[4] = Math.fround(1 + 2 ** -23);
  expect(hasSameDracoPositions(source, decoded)).toBe(false);
});

test('Draco position verification compares exact tuples when the lookup probe limit is reached', () => {
  const sourceWords = new Uint32Array(65 * 3);
  let offset = 0;
  // All 65 finite xyz tuples map to the same starting slot in the 256-entry table.
  for (let word = 0; offset < sourceWords.length; word++) {
    const hash = Math.imul(word, 0x85ebca6b);
    if (((hash ^ (hash >>> 16)) & 255) === 0) {
      sourceWords[offset] = word;
      offset += 3;
    }
  }
  const source = new Float32Array(sourceWords.buffer);
  expect(hasSameDracoPositions(source, source.subarray(-3))).toBe(true);
  expect(hasSameDracoPositions(source, new Float32Array([0, 1, 0]))).toBe(false);
});
