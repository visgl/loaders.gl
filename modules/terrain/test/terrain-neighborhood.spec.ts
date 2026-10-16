// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {createTerrainHeightGrid} from '../src/lib/terrain-height-grid';
import {resampleTerrainNodes, sampleTerrainNeighborhood} from '../src/lib/terrain-neighborhood';
import type {TerrainHeightGrid} from '../src/lib/terrain-contracts';

/** Constant tiny pixel-centered source with an explicit physical footprint. */
function createGrid(west: number, south: number, elevation: number): TerrainHeightGrid {
  return createTerrainHeightGrid(
    {width: 2, height: 2, heights: new Float32Array(4).fill(elevation)},
    {
      bounds: [west, south, west + 2, south + 2],
      registration: 'pixel-center',
      verticalDatum: 'unknown'
    }
  );
}

test('averages seam and corner contributions, never bridging no-data or outside footprints', () => {
  const grids = [
    createGrid(0, 0, 0),
    createGrid(2, 0, 10),
    createGrid(0, 2, 20),
    createGrid(2, 2, 30)
  ];
  expect(sampleTerrainNeighborhood(grids, [1, 1])).toBe(0);
  expect(sampleTerrainNeighborhood(grids, [2, 1])).toBe(5);
  expect(sampleTerrainNeighborhood(grids, [2, 2])).toBe(15);
  expect(sampleTerrainNeighborhood(grids, [-1, 1])).toBeNull();
  expect(sampleTerrainNeighborhood([], [0, 0])).toBeNull();
  expect(sampleTerrainNeighborhood(grids, [NaN, 1])).toBeNull();
  grids[1].valid.fill(0);
  expect(sampleTerrainNeighborhood(grids, [2, 1])).toBeNull();
});

test('reconstructs shared edges and corners into detached north-first physical nodes', () => {
  const source = createGrid(0, 0, 0);
  const east = createGrid(2, 0, 10),
    north = createGrid(0, 2, 20),
    northeast = createGrid(2, 2, 30);
  const result = resampleTerrainNodes(source, [east, north, northeast, east, source]);
  expect(result).toMatchObject({
    width: 3,
    height: 3,
    registration: 'grid-node',
    verticalDatum: 'unknown'
  });
  expect(Array.from(result.heights)).toEqual([10, 10, 15, 0, 0, 5, 0, 0, 5]);
  expect(Array.from(result.valid)).toEqual(new Array(9).fill(1));
  expect(result.heights).not.toBe(source.heights);
  expect(result.bounds).not.toBe(source.bounds);
  expect(resampleTerrainNodes(east, [source]).heights[3]).toBe(result.heights[5]);
});

test('keeps grid-node dimensions, nonconstant heights and physical zero', () => {
  const source = {...createGrid(0, 0, 0), registration: 'grid-node' as const};
  source.heights.set([0, 10, 20, 30]);
  expect(resampleTerrainNodes(source)).toMatchObject({
    width: 2,
    height: 2,
    heights: source.heights,
    valid: source.valid
  });
  expect(resampleTerrainNodes(createGrid(0, 0, 0)).heights).toEqual(new Float32Array(9));
});

test('preserves holes at seams instead of filling them with a valid neighbor', () => {
  const source = createGrid(0, 0, 0),
    neighbor = createGrid(2, 0, 10);
  neighbor.valid.fill(0);
  const result = resampleTerrainNodes(source, [neighbor]);
  expect(Array.from(result.valid)).toEqual([1, 1, 0, 1, 1, 0, 1, 1, 0]);
  expect(Number.isNaN(result.heights[2])).toBe(true);
});

test.each([
  {...createGrid(2, 0, 10), registration: 'grid-node' as const},
  {...createGrid(2, 0, 10), width: 3, heights: new Float32Array(6), valid: new Uint8Array(6)},
  {...createGrid(2, 0, 10), bounds: [2, 0, 6, 2] as const},
  {...createGrid(2, 0, 10), bounds: [2, 0, 4, 4] as const},
  {...createGrid(2, 0, 10), verticalDatum: 'ellipsoidal' as const}
])('rejects incompatible neighbor metadata %#', neighbor => {
  expect(() => resampleTerrainNodes(createGrid(0, 0, 0), [neighbor])).toThrow();
});
