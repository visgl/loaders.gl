// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// import type {BinaryFeatureCollection} from '@loaders.gl/schema';
import test from 'tape-promise/tape';
import {classifyRingsFlat} from '@loaders.gl/mvt/lib/utils/geometry-utils';

// Rings
import ringsSingleRing from '@loaders.gl/mvt/test/data/rings/rings_single_ring.json' assert {type: 'json'};
import ringsRingAndHole from '@loaders.gl/mvt/test/data/rings/rings_ring_and_hole.json' assert {type: 'json'};
import ringsTwoRings from '@loaders.gl/mvt/test/data/rings/rings_two_rings.json' assert {type: 'json'};
import ringsZeroSizeHole from '@loaders.gl/mvt/test/data/rings/rings_zero_size_hole.json' assert {type: 'json'};

test('classifyRingsFlat#single ring', async (t) => {
  const geom = {...ringsSingleRing};
  const classified = classifyRingsFlat(geom);
  t.deepEqual(classified.areas, [[-0.02624368667602539]]);
  t.deepEqual(classified.indices, [[0]]);
  t.end();
});

test('classifyRingsFlat#ring and hole', async (t) => {
  const geom = {...ringsRingAndHole};
  const classified = classifyRingsFlat(geom);
  t.deepEqual(classified.areas, [[-0.02624368667602539, 0.001363515853881836]]);
  t.deepEqual(classified.indices, [[0, 10]]);
  t.end();
});

test('classifyRingsFlat#two rings', async (t) => {
  const geom = {...ringsTwoRings};
  const classified = classifyRingsFlat(geom);
  t.deepEqual(classified.areas, [[-0.02624368667602539], [-0.001363515853881836]]);
  t.deepEqual(classified.indices, [[0], [10]]);
  t.end();
});

test('classifyRingsFlat#zero sized hole', async (t) => {
  // In addition to checking the result,
  // verify that the data array is shortened
  const geom = {...ringsZeroSizeHole};
  t.equal(geom.data.length, 20);
  const classified = classifyRingsFlat(geom);
  t.deepEqual(classified.areas, [[-0.44582176208496094]]);
  t.deepEqual(classified.indices, [[0]]);
  t.equal(classified.data.length, 12);
  t.end();
});
