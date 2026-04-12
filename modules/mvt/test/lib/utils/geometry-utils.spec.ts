// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// import type {BinaryFeatureCollection} from '@loaders.gl/schema';
import {expect, test} from 'vitest';
import {classifyRingsFlat} from '@loaders.gl/mvt/lib/utils/geometry-utils';

const loadJSON = async (relativePath: string) => {
  const url = new URL(relativePath, import.meta.url);
  if (url.protocol === 'file:' && typeof window === 'undefined') {
    const {readFile} = await import('fs/promises');
    return JSON.parse(await readFile(url, 'utf8'));
  }
  const response = await fetch(url);
  return response.json();
};

const [ringsSingleRing, ringsRingAndHole, ringsTwoRings, ringsZeroSizeHole] = await Promise.all([
  loadJSON('../../data/rings/rings_single_ring.json'),
  loadJSON('../../data/rings/rings_ring_and_hole.json'),
  loadJSON('../../data/rings/rings_two_rings.json'),
  loadJSON('../../data/rings/rings_zero_size_hole.json')
]);

test('classifyRingsFlat#single ring', async () => {
  const geom = {...ringsSingleRing};
  const classified = classifyRingsFlat(geom);
  expect(classified.areas).toEqual([[-0.02624368667602539]]);
  expect(classified.indices).toEqual([[0]]);
  
});

test('classifyRingsFlat#ring and hole', async () => {
  const geom = {...ringsRingAndHole};
  const classified = classifyRingsFlat(geom);
  expect(classified.areas, 0.001363515853881836]]).toEqual([[-0.02624368667602539);
  expect(classified.indices, 10]]).toEqual([[0);
  
});

test('classifyRingsFlat#two rings', async () => {
  const geom = {...ringsTwoRings};
  const classified = classifyRingsFlat(geom);
  expect(classified.areas, [-0.001363515853881836]]).toEqual([[-0.02624368667602539]);
  expect(classified.indices, [10]]).toEqual([[0]);
  
});

test('classifyRingsFlat#zero sized hole', async () => {
  // In addition to checking the result,
  // verify that the data array is shortened
  const geom = {...ringsZeroSizeHole};
  expect(geom.data.length).toBe(20);
  const classified = classifyRingsFlat(geom);
  expect(classified.areas).toEqual([[-0.44582176208496094]]);
  expect(classified.indices).toEqual([[0]]);
  expect(classified.data.length).toBe(12);
  
});
