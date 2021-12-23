/** @typedef {import('@loaders.gl/schema').BinaryFeatures} BinaryFeatures */
import test from 'tape-promise/tape';
import {TEST_EXPORTS} from '@loaders.gl/mvt/lib/binary-vector-tile/vector-tile-feature';

const {classifyRings} = TEST_EXPORTS;

// Rings
import ringsSingleRing from '@loaders.gl/mvt/test/data/rings_single_ring.json';
import ringsRingAndHole from '@loaders.gl/mvt/test/data/rings_ring_and_hole.json';
import ringsTwoRings from '@loaders.gl/mvt/test/data/rings_two_rings.json';
import ringsZeroSizeHole from '@loaders.gl/mvt/test/data/rings_zero_size_hole.json';


test('Rings - single ring', async (t) => {
  const geom = {...ringsSingleRing};
  const classified = classifyRings(geom);
  t.deepEqual(classified.areas, [[-0.02624368667602539]]);
  t.deepEqual(classified.indices, [[0]]);
  t.end();
});

test('Rings - ring and hole', async (t) => {
  const geom = {...ringsRingAndHole};
  const classified = classifyRings(geom);
  t.deepEqual(classified.areas, [[-0.02624368667602539, 0.001363515853881836]]);
  t.deepEqual(classified.indices, [[0, 10]]);
  t.end();
});

test('Rings - two rings', async (t) => {
  const geom = {...ringsTwoRings};
  const classified = classifyRings(geom);
  t.deepEqual(classified.areas, [[-0.02624368667602539], [-0.001363515853881836]]);
  t.deepEqual(classified.indices, [[0], [10]]);
  t.end();
});

test('Rings - zero sized hole', async (t) => {
  // In addition to checking the result,
  // verify that the data array is shortened
  const geom = {...ringsZeroSizeHole};
  t.equal(geom.data.length, 20);
  const classified = classifyRings(geom);
  t.deepEqual(classified.areas, [[-0.44582176208496094]]);
  t.deepEqual(classified.indices, [[0]]);
  t.equal(classified.data.length, 12);
  t.end();
});
