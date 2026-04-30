// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import test from 'tape-promise/tape';
import {getGaussianSplatDataFromArrowTable} from '../src/splat/splat-data';
import {
  getSplatTileBufferByteLengths,
  getSplatTileGrid,
  getSplatTransientBufferByteLengths,
  packSplatDepthKey,
  SPLAT_RADIX_BUCKETS,
  SPLAT_RADIX_PASS_COUNT,
  SPLAT_TILE_RADIX_MAX_SPLATS,
  SPLAT_TILE_RADIX_WORKGROUP_SIZE,
  SPLAT_TILE_SIZE_PIXELS
} from '../src/splat/splat-sort';

/** Creates a minimal Gaussian splat Arrow table. */
function createGaussianSplatTable(): arrow.Table {
  return arrow.tableFromArrays({
    POSITION: [
      [0, 0, -2],
      [1, 2, -1]
    ],
    f_dc_0: [0, 1],
    f_dc_1: [0, 0],
    f_dc_2: [0, -1],
    opacity: [0, 2],
    scale_0: [0, 1],
    scale_1: [0, 0],
    scale_2: [0, -1],
    rot_0: [1, 1],
    rot_1: [0, 0],
    rot_2: [0, 0],
    rot_3: [0, 0]
  });
}

test('splat-data extracts shared Gaussian splat columns', t => {
  const data = getGaussianSplatDataFromArrowTable(createGaussianSplatTable());

  t.equal(data.length, 2, 'extracts row count');
  t.deepEqual(Array.from(data.positions), [0, 0, -2, 1, 2, -1], 'extracts positions');
  t.deepEqual(Array.from(data.rotations), [1, 0, 0, 0, 1, 0, 0, 0], 'extracts rotations');
  t.equal(data.radii[0], 3, 'decodes log scale support radius');
  t.ok(Math.abs(data.opacities[0] - 0.5) < 1e-6, 'decodes logit opacity');
  t.deepEqual(Array.from(data.colors.slice(0, 4)), [128, 128, 128, 128], 'derives color');
  t.end();
});

test('splat-data reports missing required columns', t => {
  const table = arrow.tableFromArrays({
    POSITION: [[0, 0, 0]]
  });

  t.throws(
    () => getGaussianSplatDataFromArrowTable(table),
    /SplatLayer requires a scale_0 column/,
    'throws a clear error for missing required columns'
  );
  t.end();
});

test('splat-sort exposes radix constants and key packing', t => {
  const nearKey = packSplatDepthKey(0, {depthMin: 0, depthMax: 10});
  const farKey = packSplatDepthKey(10, {depthMin: 0, depthMax: 10});
  const byteLengths = getSplatTransientBufferByteLengths(2);

  t.equal(SPLAT_RADIX_BUCKETS, 16, 'uses 4-bit radix buckets');
  t.equal(SPLAT_RADIX_PASS_COUNT, 8, 'uses eight radix passes');
  t.ok(farKey < nearKey, 'farther depth sorts before nearer depth');
  t.equal(byteLengths.indices, 8, 'allocates one u32 per index');
  t.equal(byteLengths.projected, 32, 'allocates one vec4<f32> per projected splat');
  t.end();
});

test('splat-sort calculates tile grid and buffer sizes', t => {
  const tileGrid = getSplatTileGrid(1920, 1080);
  const byteLengths = getSplatTileBufferByteLengths(1000, tileGrid);

  t.equal(SPLAT_TILE_SIZE_PIXELS, 16, 'uses 16 pixel default tiles');
  t.equal(SPLAT_TILE_RADIX_MAX_SPLATS, 1024, 'reserves 1024 splats per tile workgroup');
  t.equal(SPLAT_TILE_RADIX_WORKGROUP_SIZE, 256, 'uses 256 lane tile radix workgroups');
  t.equal(tileGrid.columns, 120, 'calculates tile columns');
  t.equal(tileGrid.rows, 68, 'calculates tile rows');
  t.equal(tileGrid.tileCount, 8160, 'calculates tile count');
  t.equal(byteLengths.tileCounts, 8160 * 4, 'allocates one count per tile');
  t.equal(byteLengths.tileOffsets, 8161 * 4, 'allocates sentinel tile offset');
  t.equal(byteLengths.tileIndices, 1000 * 4, 'allocates compacted splat references');
  t.equal(byteLengths.overflowCount, 4, 'allocates overflow counter');
  t.equal(byteLengths.overflowIndices, 4, 'allocates at least one overflow slot');
  t.end();
});
