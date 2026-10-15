// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {TerrainHeightField} from '../src/lib/terrain-height-field';
import {sampleTerrainHeightGrid} from '../src/lib/terrain-height-grid';
import type {TerrainHeightGrid} from '../src/lib/terrain-contracts';
import type {TerrainFieldBounds} from '../src/lib/terrain-height-field';

/** Tiny asymmetric immutable field, optionally with a single no-data sample. */
function grid(
  bounds: TerrainFieldBounds = [0, 0, 10, 10],
  registration: TerrainHeightGrid['registration'] = 'grid-node',
  hole = -1
): TerrainHeightGrid {
  const heights = Float32Array.from({length: 12}, (_, index) => index * 13 - 50);
  const valid = new Uint8Array(12).fill(1);
  if (hole >= 0) {
    valid[hole] = 0;
    heights[hole] = NaN;
  }
  return {width: 4, height: 3, heights, valid, bounds, registration, verticalDatum: 'unknown'};
}

/** Direct-scan admission oracle; degenerate shared edges measure union length, not duplicate footprints. */
function referenceCoverage(
  grids: readonly TerrainHeightGrid[],
  bounds: TerrainFieldBounds
): boolean {
  const [west, south, east, north] = bounds,
    width = east - west,
    height = north - south;
  if (!width && !height) return referenceNeighborhood(grids, [west, south]) !== null;
  let covered = 0;
  const intervals: [number, number][] = [];
  for (const source of grids) {
    const left = Math.max(west, source.bounds[0]),
      right = Math.min(east, source.bounds[2]);
    const bottom = Math.max(south, source.bounds[1]),
      top = Math.min(north, source.bounds[3]);
    if (left > right || bottom > top || (width && left === right) || (height && bottom === top))
      continue;
    const pixel = source.registration === 'pixel-center';
    const column = (x: number) =>
      Math.max(
        0,
        Math.min(
          source.width - 1,
          ((x - source.bounds[0]) / (source.bounds[2] - source.bounds[0])) *
            (pixel ? source.width : source.width - 1) -
            (pixel ? 0.5 : 0)
        )
      );
    const row = (y: number) =>
      Math.max(
        0,
        Math.min(
          source.height - 1,
          ((source.bounds[3] - y) / (source.bounds[3] - source.bounds[1])) *
            (pixel ? source.height : source.height - 1) -
            (pixel ? 0.5 : 0)
        )
      );
    for (let y = Math.floor(row(top)); y <= Math.ceil(row(bottom)); y++)
      for (let x = Math.floor(column(left)); x <= Math.ceil(column(right)); x++)
        if (!source.valid[y * source.width + x]) return false;
    covered +=
      width && height ? (right - left) * (top - bottom) : width ? right - left : top - bottom;
    intervals.push(width ? [left, right] : [bottom, top]);
  }
  if (!width || !height) {
    const endpoints = [...new Set(intervals.flat())].sort((first, second) => first - second);
    covered = 0;
    for (let index = 1; index < endpoints.length; index++)
      if (
        intervals.some(([first, last]) => first <= endpoints[index - 1] && last >= endpoints[index])
      )
        covered += endpoints[index] - endpoints[index - 1];
  }
  return covered >= (width && height ? width * height : width || height) * (1 - 1e-10);
}

test.each([
  'grid-node',
  'pixel-center'
] as const)('matches legacy sampling with %s registration, holes, seams and roundoff', registration => {
  const sources = [
    grid([0, 0, 10, 10], registration, 5),
    grid([10, 0, 20, 10], registration),
    grid([0, 10, 10, 20], registration)
  ];
  const field = new TerrainHeightField(sources);
  for (const x of [-1, 0, 2.5, 5, 9.9999999995, 10, 10.0000000005, 15, 20, 21])
    for (const y of [-1, 0, 3, 5, 10, 15, 20, 21]) {
      expect(field.sampleHeight([x, y])).toBe(referenceNeighborhood(sources, [x, y]));
    }
  expect(field.sampleHeight([NaN, 1])).toBeNull();
  expect(field.sampleHeight([1, Infinity])).toBeNull();
});

test('preserves source accumulation order despite spatial sorting, overlap and touching holes', () => {
  const sources = [grid(), grid(), grid()];
  sources[0].heights.fill(1e20);
  sources[1].heights.fill(-1e20);
  sources[2].heights.fill(3);
  expect(new TerrainHeightField(sources).sampleHeight([5, 5])).toBe(1);
  expect(new TerrainHeightField([...sources].reverse()).sampleHeight([5, 5])).toBe(0);
  expect(
    new TerrainHeightField([
      grid([0, 0, 10, 10]),
      grid([10, 0, 20, 10], 'grid-node', 4)
    ]).sampleHeight([10, 5])
  ).toBeNull();
});

test.each([
  16, 17, 96
])('direct/tree sampling preserves legacy boundaries and source order for %i grids', count => {
  const sources = Array.from({length: count}, (_, index) =>
    grid(
      [
        (index % 12) * 10,
        Math.floor(index / 12) * 10,
        (index % 12) * 10 + 10,
        Math.floor(index / 12) * 10 + 10
      ],
      index % 2 ? 'pixel-center' : 'grid-node',
      index % 5 ? -1 : 5
    )
  );
  const field = new TerrainHeightField(sources);
  for (const source of sources)
    for (const offset of [0, 1e-10, 5, 10]) {
      const point: [number, number] = [source.bounds[0] + offset, source.bounds[1] + offset];
      expect(field.sampleHeight(point)).toBe(referenceNeighborhood(sources, point));
    }
  const overlaps = Array.from({length: count}, () => grid());
  overlaps[0].heights.fill(1e20);
  overlaps[1].heights.fill(-1e20);
  expect(new TerrainHeightField(overlaps).sampleHeight([5, 5])).toBe(
    referenceNeighborhood(overlaps, [5, 5])
  );
});

test.each([
  'grid-node',
  'pixel-center'
] as const)('cached and zero-budget %s masks match conservative legacy coverage', registration => {
  const sources = [grid([0, 0, 10, 10], registration, 5), grid([10, 0, 20, 10], registration)];
  const cached = new TerrainHeightField(sources),
    streaming = new TerrainHeightField(sources, {maxMaskBytes: 0});
  for (const west of [-1, 0, 5, 9, 10, 15, 20])
    for (const south of [-1, 0, 5, 10])
      for (const width of [0, 1, 5])
        for (const height of [0, 1, 5]) {
          const bounds: TerrainFieldBounds = [west, south, west + width, south + height];
          const expected = referenceCoverage(sources, bounds);
          expect(cached.coversBounds(bounds), `cached ${bounds}`).toBe(expected);
          expect(streaming.coversBounds(bounds), `streaming ${bounds}`).toBe(expected);
        }
  expect(cached.getStatistics().maskBuilds).toBe(1);
  expect(cached.getStatistics().maskBytes).toBe(5 * 4 * 4);
  expect(streaming.getStatistics().maskBytes).toBe(0);
});

test('never double-counts overlapping footprints to bridge missing area or line coverage', () => {
  const field = new TerrainHeightField([grid(), grid()]);
  expect(field.coversBounds([0, 0, 10, 10])).toBe(true);
  expect(field.coversBounds([0, 0, 20, 10])).toBe(false);
  expect(field.coversBounds([0, 5, 20, 5])).toBe(false);
  expect(field.coversBounds([5, 0, 5, 20])).toBe(false);
  const separated = new TerrainHeightField([grid([0, 0, 5, 10]), grid([6, 0, 10, 10])]);
  expect(separated.coversBounds([0, 0, 10, 10])).toBe(false);
  expect(separated.coversBounds([5, 0, 5, 10])).toBe(true);
  expect(separated.coversBounds([5.5, 0, 5.5, 10])).toBe(false);
  const seam = new TerrainHeightField([grid(), grid([10, 0, 20, 10])]);
  expect(seam.coversBounds([10, -1, 10, 4])).toBe(false);
});

test('even narrow representable gaps are not admitted by an area or length tolerance', () => {
  const field = new TerrainHeightField([grid([0, 0, 5, 10]), grid([5 + 1e-12, 0, 10, 10])]);
  expect(field.coversBounds([0, 0, 10, 10])).toBe(false);
  expect(field.coversBounds([0, 5, 10, 5])).toBe(false);
  expect(new TerrainHeightField([grid()]).coversBounds([0, 0, 10 + 1e-12, 10])).toBe(false);
});

test.each([
  0, 1024
])('closed probe boundaries include touching neighbor holes with mask budget %i', maxMaskBytes => {
  const sources = [grid(), grid([10, 0, 20, 10], 'grid-node', 4)];
  const field = new TerrainHeightField(sources, {maxMaskBytes});
  expect(field.sampleHeight([10, 5])).toBeNull();
  expect(field.coversBounds([0, 0, 10, 10])).toBe(false);
  expect(field.coversBounds([0, 0, 9, 10])).toBe(true);
  const north = new TerrainHeightField([grid(), grid([0, 10, 10, 20], 'grid-node', 8)], {
    maxMaskBytes
  });
  expect(north.coversBounds([0, 0, 10, 10])).toBe(false);
});

test('bounds-admitted masks are reused and budget pressure retains exact fallback', () => {
  const first = grid([0, 0, 10, 10], 'grid-node', 5),
    second = grid([10, 0, 20, 10], 'grid-node', 5);
  const field = new TerrainHeightField([first, second], {maxMaskBytes: 80});
  expect(field.getStatistics()).toMatchObject({maskBytes: 0, maskBuilds: 0});
  expect(field.coversBounds([8, 0, 9, 1])).toBe(true);
  expect(field.getStatistics()).toMatchObject({maskBytes: 80, maskBuilds: 1, maskSamples: 18});
  const before = field.getStatistics();
  expect(field.coversBounds([8, 0, 9, 1])).toBe(true);
  expect(field.getStatistics().maskSamples).toBe(before.maskSamples);
  expect(field.coversBounds([18, 0, 19, 1])).toBe(true);
  expect(field.coversBounds([10, 0, 20, 10])).toBe(false);
  expect(field.getStatistics()).toMatchObject({maskBytes: 80, maskBuilds: 1});
  expect(field.getStatistics().maskSamples).toBeGreaterThan(before.maskSamples);
  before.maskBytes = 0;
  expect(field.getStatistics().maskBytes).toBe(80);
});

test('prunes a 96-grid field before sampling or mask work, without scanning unrelated data', () => {
  const sources = Array.from({length: 96}, (_, index) =>
    grid([index * 10, 0, index * 10 + 10, 10])
  );
  const field = new TerrainHeightField(sources);
  expect(field.sampleHeight([475, 5])).toBe(referenceNeighborhood(sources, [475, 5]));
  expect(field.getStatistics()).toMatchObject({candidateGrids: 1, maskSamples: 0});
  expect(field.getStatistics().boundsTests).toBeLessThan(20);
  expect(field.coversBounds([472, 2, 478, 8])).toBe(true);
  expect(field.getStatistics()).toMatchObject({candidateGrids: 2, maskSamples: 12, maskBytes: 0});
  expect(field.coversBounds([472, 2, 478, 8])).toBe(true);
  expect(field.getStatistics().maskSamples).toBe(12);
});

test('snapshots membership and footprints, retains immutable arrays, and handles an empty generation', () => {
  const bounds: [number, number, number, number] = [0, 0, 10, 10],
    source = grid(bounds);
  const sources = [source],
    field = new TerrainHeightField(sources);
  sources.length = 0;
  bounds[0] = 100;
  expect(field.sampleHeight([5, 5])).toBe(21.5);
  expect(new TerrainHeightField([]).sampleHeight([0, 0])).toBeNull();
  expect(new TerrainHeightField([]).coversBounds([0, 0, 1, 1])).toBe(false);
  expect(new TerrainHeightField([]).coversBounds([0, 0, 0, 0])).toBe(false);
});

test.each([-1, 0.5, Infinity, NaN])('rejects invalid retained mask budget %s', maxMaskBytes => {
  expect(() => new TerrainHeightField([], {maxMaskBytes})).toThrow(/mask budget/);
});

test.each([
  {...grid(), width: 1},
  {...grid(), height: 1},
  {...grid(), valid: new Uint8Array(1)},
  {...grid(), heights: new Float32Array(1)},
  {...grid(), bounds: [0, 0, 0, 1] as const},
  {...grid(), bounds: [0, 0, Infinity, 1] as const},
  {...grid(), bounds: [-1e308, 0, 1e308, 1] as const}
])('rejects malformed field input %#', source => {
  expect(() => new TerrainHeightField([source])).toThrow(/grid or datum/);
});

test('rejects incompatible vertical datums and invalid query rectangles', () => {
  expect(() => new TerrainHeightField([grid(), {...grid(), verticalDatum: 'orthometric'}])).toThrow(
    /datum/
  );
  const field = new TerrainHeightField([grid()]);
  for (const bounds of [
    [10, 0, 0, 10],
    [0, 10, 10, 0],
    [0, 0, NaN, 10],
    [0, 0, 1e200, 1e200],
    [0, 0, 1e-200, 1e-200]
  ] as const)
    expect(() => field.coversBounds(bounds)).toThrow(/probe/);
});

/** Independent direct footprint scan, deliberately not using the field index. */
function referenceNeighborhood(
  grids: readonly TerrainHeightGrid[],
  position: readonly [number, number]
): number | null {
  let sum = 0,
    count = 0;
  for (const source of grids) {
    const [west, south, east, north] = source.bounds;
    const tolerance = Math.max(east - west, north - south) * 1e-10;
    if (
      position[0] < west - tolerance ||
      position[0] > east + tolerance ||
      position[1] < south - tolerance ||
      position[1] > north + tolerance
    )
      continue;
    const value = sampleTerrainHeightGrid(source, [
      Math.max(west, Math.min(east, position[0])),
      Math.max(south, Math.min(north, position[1]))
    ]);
    if (value === null) return null;
    sum += value;
    count++;
  }
  return count ? sum / count : null;
}
