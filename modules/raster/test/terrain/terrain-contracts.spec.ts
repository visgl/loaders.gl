// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {
  createTerrainHeightGrid,
  sampleTerrainHeightGrid,
  decodeTerrainHeightmap,
  TERRARIUM_ELEVATION_DECODER
} from '../../src/terrain/heightmap';
import type {TerrainGridMetadata, TerrainSurface} from '../../src/terrain/heightmap';

const metadata: TerrainGridMetadata = {
  bounds: [0, 0, 2, 2],
  registration: 'grid-node',
  verticalDatum: 'unknown'
};
const heightmap = {width: 2, height: 2, heights: new Float32Array([0, 10, 20, 30])};

describe('shared terrain contracts', () => {
  test.each([
    'pixel-center',
    'grid-node'
  ] as const)('snaps exact %s samples at world-scale bounds without filling nearby holes', registration => {
    const halfWorld = Math.PI * 6378137;
    const heights = new Float32Array(256 * 2);
    heights[0] = 42;
    const validity = new Uint8Array(heights.length);
    validity[0] = 1;
    const grid = createTerrainHeightGrid(
      {width: 256, height: 2, heights},
      {
        bounds: [-halfWorld, -halfWorld, halfWorld, halfWorld],
        registration,
        verticalDatum: 'unknown'
      },
      validity
    );
    const horizontal = -halfWorld + (registration === 'pixel-center' ? halfWorld / 256 : 0);
    const vertical = halfWorld - (registration === 'pixel-center' ? halfWorld / 2 : 0);
    expect(sampleTerrainHeightGrid(grid, [horizontal, vertical])).toBe(42);
    expect(
      sampleTerrainHeightGrid(grid, [horizontal + (halfWorld / 256) * 1e-5, vertical])
    ).toBeNull();
  });
  test('preserves physical meters and detaches sample, mask and footprint storage', () => {
    const source = {...heightmap, heights: heightmap.heights.slice()};
    const bounds: [number, number, number, number] = [0, 0, 2, 2];
    const validity = new Uint8Array([255, 1, 0, 1]);
    const grid = createTerrainHeightGrid(source, {...metadata, bounds}, validity);
    source.heights.fill(100);
    validity.fill(0);
    bounds[0] = -100;
    expect(Array.from(grid.valid)).toEqual([1, 1, 0, 1]);
    expect(Array.from(grid.heights)).toEqual([0, 10, NaN, 30]);
    expect(grid.bounds).toEqual([0, 0, 2, 2]);
    expect(grid.registration).toBe('grid-node');
    expect(grid.verticalDatum).toBe('unknown');
  });

  test('composes the existing decoder without alpha or border inference', () => {
    const decoded = decodeTerrainHeightmap(
      {
        width: 2,
        height: 2,
        data: new Uint8Array([128, 0, 0, 0, 128, 10, 0, 255, 128, 20, 0, 255, 128, 30, 0, 255])
      },
      TERRARIUM_ELEVATION_DECODER
    );
    const grid = createTerrainHeightGrid(decoded, metadata);
    expect(grid.heights).toEqual(heightmap.heights);
    expect(grid.valid).toEqual(new Uint8Array([1, 1, 1, 1]));
  });

  test.each([
    'grid-node',
    'pixel-center'
  ] as const)('samples north-first %s grids and closed edges', registration => {
    const grid = createTerrainHeightGrid(heightmap, {...metadata, registration});
    expect(sampleTerrainHeightGrid(grid, [1, 1])).toBe(15);
    expect(sampleTerrainHeightGrid(grid, [0, 2])).toBe(0);
    expect(sampleTerrainHeightGrid(grid, [2, 0])).toBe(30);
    expect(sampleTerrainHeightGrid(grid, [0.5, 1.5])).toBe(registration === 'grid-node' ? 7.5 : 0);
    expect(sampleTerrainHeightGrid(grid, [-Number.EPSILON, 1])).toBeNull();
    expect(sampleTerrainHeightGrid(grid, [NaN, 1])).toBeNull();
  });

  test('requires only nonzero-weight support and never fills missing heights', () => {
    const grid = createTerrainHeightGrid(heightmap, metadata, new Uint8Array([1, 0, 0, 0]));
    expect(sampleTerrainHeightGrid(grid, [0, 2])).toBe(0);
    expect(sampleTerrainHeightGrid(grid, [1, 1])).toBeNull();
    expect(sampleTerrainHeightGrid(grid, [2, 2])).toBeNull();
  });

  test.each([
    'ellipsoidal',
    'orthometric',
    'unknown'
  ] as const)('retains %s datum without conversion', verticalDatum => {
    expect(createTerrainHeightGrid(heightmap, {...metadata, verticalDatum}).verticalDatum).toBe(
      verticalDatum
    );
  });

  test.each([
    0,
    1,
    1.5,
    Infinity,
    Number.MAX_SAFE_INTEGER
  ])('rejects invalid grid width %s', width => {
    expect(() => createTerrainHeightGrid({...heightmap, width}, metadata)).toThrow(/heightmap/);
  });
  test('rejects incomplete heights and mask', () => {
    expect(() =>
      createTerrainHeightGrid({...heightmap, heights: new Float32Array(3)}, metadata)
    ).toThrow(/heightmap/);
    expect(() => createTerrainHeightGrid(heightmap, metadata, new Uint8Array(3))).toThrow(
      /validity/
    );
  });
  test.each(
    (
      [
        [0, 0, 0, 2],
        [0, 2, 2, 0],
        [NaN, 0, 2, 2],
        [-1e308, 0, 1e308, 2]
      ] as const
    ).map(bounds => ({bounds}))
  )('rejects invalid bounds $bounds', ({bounds}) => {
    expect(() => createTerrainHeightGrid(heightmap, {...metadata, bounds})).toThrow(/bounds/);
  });
  test.each([
    NaN,
    Infinity,
    -Infinity
  ])('rejects valid nonfinite height %s but accepts it as explicitly missing', height => {
    const source = {...heightmap, heights: new Float32Array([height, 1, 2, 3])};
    expect(() => createTerrainHeightGrid(source, metadata)).toThrow(/finite/);
    expect(
      createTerrainHeightGrid(source, metadata, new Uint8Array([0, 1, 1, 1])).heights[0]
    ).toBeNaN();
  });
  test('validates registration and datum even for untyped inputs', () => {
    expect(() =>
      Reflect.apply(createTerrainHeightGrid, null, [
        heightmap,
        {...metadata, registration: 'unknown'}
      ])
    ).toThrow(/explicit/);
    expect(() =>
      Reflect.apply(createTerrainHeightGrid, null, [
        heightmap,
        {...metadata, verticalDatum: 'provider'}
      ])
    ).toThrow(/explicit/);
  });
  test('a structural surface returns displayed geometry separately from physical height', () => {
    const surface: TerrainSurface = {
      projection: 'web-mercator',
      intersectRay(ray, maxDistance = Infinity) {
        const distance = ((ray.origin[2] - 100) / -ray.direction[2]) * Math.hypot(...ray.direction);
        return distance >= 0 && distance <= maxDistance
          ? {
              position: [0, 0, 100],
              coordinate: [0, 0, 10],
              distance,
              normal: [0, 0, 1],
              triangleIndex: 0,
              barycentric: [1, 0, 0]
            }
          : null;
      }
    };
    const hit = surface.intersectRay({origin: [0, 0, 200], direction: [0, 0, -2]}, 100);
    expect(hit?.position[2]).toBe(100);
    expect(hit?.coordinate[2]).toBe(10);
    expect(hit?.distance).toBe(100);
    expect(surface.intersectRay({origin: [0, 0, 200], direction: [0, 0, -2]}, 99)).toBeNull();
  });
});
