// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {beforeAll, expect, test} from 'vitest';
import {ClusterIndex, type ClusterIndexOptions} from '@loaders.gl/geoarrow';

const WORLD = [-180, -90, 180, 90] as const;
let index: ClusterIndex;
beforeAll(() => {
  index = new ClusterIndex(new Float64Array([0, 0, 0.01, 0, 10, 0, 10.01, 0, 140, 30]), {
    maxZoom: 12,
    rowIndices: [3, 5, 8, 9, 14],
    aggregations: {
      total: {values: [1, 2, 4, 8, 16], operation: 'sum'},
      minimum: {values: [1, 2, 4, 8, 16], operation: 'min'},
      maximum: {values: [1, 2, 4, 8, 16], operation: 'max'}
    }
  });
});

test('hierarchy preserves counts, original rows and associative aggregates at every zoom', () => {
  for (let zoom = 0; zoom <= 13; zoom++) {
    const nodes = index.getClusters(WORLD, zoom);
    expect(nodes.reduce((total, node) => total + node.pointCount, 0)).toBe(5);
    expect(nodes.reduce((total, node) => total + node.properties.total, 0)).toBe(31);
    const rows = nodes.flatMap(node =>
      node.isCluster ? index.getLeaves(node.id, {limit: Infinity}) : [node.rowIndex!]
    );
    expect(rows.sort((first, second) => first - second)).toEqual([3, 5, 8, 9, 14]);
    for (const node of nodes.filter(node => node.isCluster)) {
      const children = index.getChildren(node.id);
      expect(children.length).toBeGreaterThan(1);
      expect(children.reduce((total, child) => total + child.pointCount, 0)).toBe(node.pointCount);
      expect(node.properties.minimum).toBe(
        Math.min(...children.map(child => child.properties.minimum))
      );
      expect(node.properties.maximum).toBe(
        Math.max(...children.map(child => child.properties.maximum))
      );
      expect(index.getExpansionZoom(node.id)).toBeGreaterThan(zoom);
      expect(
        index
          .getClusters(WORLD, index.getExpansionZoom(node.id))
          .some(child => child.id === node.id)
      ).toBe(false);
    }
  }
});

test('member pagination skips subtrees, accepts zero and Infinity and rejects invalid IDs', () => {
  const cluster = index.getClusters(WORLD, 0).find(node => node.pointCount === 4)!;
  const rows = index.getLeaves(cluster.id, {limit: Infinity});
  expect(rows).toEqual([3, 5, 8, 9]);
  expect(index.getLeaves(cluster.id)).toEqual(rows);
  expect(index.getLeaves(cluster.id, {offset: 2, limit: 1})).toEqual([8]);
  expect(index.getLeaves(cluster.id, {offset: 99})).toEqual([]);
  expect(index.getLeaves(cluster.id, {limit: 0})).toEqual([]);
  expect(() => index.getLeaves(cluster.id, {offset: -1})).toThrow();
  expect(() => index.getLeaves(cluster.id, {limit: 1.5})).toThrow();
  expect(() => index.getChildren(0)).toThrow('Unknown cluster');
  expect(() => index.getNode(NaN)).toThrow('Unknown cluster');
  expect(() => index.getExpansionZoom(-1)).toThrow('Unknown cluster');
  expect(index.getNode(cluster.id)).toEqual(cluster);
  expect(index.getNode(0).rowIndex).toBe(3);
});

test('snapshots input coordinates, rows, aggregates and output objects', () => {
  const coordinates = [12.1234567890123, 44.1234567890123, 12.1234567890123, 44.1234567890123];
  const rowIndices = [8, 9];
  const values = [4, 6];
  const snapshot = new ClusterIndex(coordinates, {
    maxZoom: 2,
    rowIndices,
    aggregations: {value: {values, operation: 'sum'}}
  });
  coordinates.fill(0);
  rowIndices.fill(0);
  values.fill(0);
  const cluster = snapshot.getClusters(WORLD, 2)[0];
  expect(cluster.pointCount).toBe(2);
  expect(snapshot.getExpansionZoom(cluster.id)).toBe(3);
  expect(snapshot.getLeaves(cluster.id)).toEqual([8, 9]);
  cluster.properties.value = 999;
  cluster.position[0] = 0;
  expect(snapshot.getNode(cluster.id).properties.value).toBe(10);
  expect(snapshot.getNode(0).position).toEqual([12.1234567890123, 44.1234567890123]);
});

test('clusters across the antimeridian with a local center and deduplicates wrapped queries', () => {
  const wrapped = new ClusterIndex([179.99, 0, -179.99, 0, 0, 0], {maxZoom: 1});
  const cluster = wrapped.getClusters([170, -10, -170, 10], 1)[0];
  expect(cluster.pointCount).toBe(2);
  expect(Math.abs(cluster.position[0])).toBeCloseTo(180);
  expect(wrapped.getClusters([170, -10, 190, 10], 1)).toEqual([cluster]);
  expect(wrapped.getClusters([-540, -90, 540, 90], 1)).toHaveLength(2);
  expect(wrapped.getClusters([0, -10, 180, 10], 1)).toHaveLength(2);
  const hugeRadius = new ClusterIndex([0, 0, 179, 0, -179, 0], {radiusPixels: 1024, maxZoom: 0});
  expect(hugeRadius.getClusters(WORLD, 0)[0].pointCount).toBe(3);
});

test('minimum point count, fractional zoom, pole clamp and empty inputs have explicit behavior', () => {
  const sparse = new ClusterIndex([0, 90, 0, 90, 0, -90], {minPoints: 3, minZoom: 2, maxZoom: 3});
  expect(sparse.getClusters(WORLD, 2)).toHaveLength(3);
  expect(sparse.getClusters(WORLD, -10)).toEqual(sparse.getClusters(WORLD, 2));
  expect(sparse.getClusters(WORLD, 3.9)).toEqual(sparse.getClusters(WORLD, 3));
  expect(sparse.getClusters(WORLD, 100)).toHaveLength(3);
  expect(sparse.getClusters([-180, 91, 180, 100], 2)).toEqual([]);
  expect(sparse.getClusters([-180, 86, 180, 89], 4)).toEqual([]);
  expect(sparse.getClusters([-180, 89, 180, 90], 4)).toHaveLength(2);
  expect(new ClusterIndex([]).getClusters(WORLD, 0)).toEqual([]);
  expect(() => sparse.getClusters([0, 10, 1, -10], 0)).toThrow();
  expect(() => sparse.getClusters(WORLD, Infinity)).toThrow();
});

test('small radius and sparse world queries agree with brute force leaf filtering', () => {
  const coordinates = Array.from({length: 400}, (_, index) =>
    index % 2 ? (index % 120) - 60 : index * 0.8 - 160
  );
  const sparse = new ClusterIndex(coordinates, {maxZoom: 0, radiusPixels: 1});
  for (const bounds of [
    [-1, -1, 1, 1],
    [-170, -80, 170, 80],
    [-161, -61, -159, -59]
  ] as const) {
    const expected = Array.from({length: 200}, (_, index) => index).filter(
      index =>
        coordinates[index * 2] >= bounds[0] &&
        coordinates[index * 2] <= bounds[2] &&
        coordinates[index * 2 + 1] >= bounds[1] &&
        coordinates[index * 2 + 1] <= bounds[3]
    );
    expect(sparse.getClusters(bounds, 1).map(node => node.rowIndex)).toEqual(expected);
  }
});

test.each<ClusterIndexOptions>([
  {minZoom: -1},
  {maxZoom: 31},
  {minZoom: 2, maxZoom: 1},
  {maxZoom: 1.5},
  {radiusPixels: 0},
  {radiusPixels: Infinity},
  {radiusPixels: 1e-30},
  {tileSize: -1},
  {minPoints: 1},
  {rowIndices: []},
  {rowIndices: [-1]},
  {aggregations: {value: {operation: 'sum', values: []}}},
  {aggregations: {value: {operation: 'sum', values: [NaN]}}}
])('rejects invalid construction options %j', options => {
  expect(() => new ClusterIndex([0, 0], options)).toThrow();
});

test('rejects invalid coordinate pairs and aggregation overflow', () => {
  for (const coordinates of [[0], [NaN, 0], [0, 91]])
    expect(() => new ClusterIndex(coordinates)).toThrow();
  expect(
    () =>
      new ClusterIndex([0, 0, 0, 0], {
        aggregations: {
          total: {values: [Number.MAX_VALUE, Number.MAX_VALUE], operation: 'sum'}
        }
      })
  ).toThrow('overflow');
});

test('radius boundaries are inclusive and grouping follows seeds rather than transitive chains', () => {
  const options = {maxZoom: 0, radiusPixels: 64, tileSize: 512};
  expect(new ClusterIndex([0, 0, 45, 0], options).getClusters(WORLD, 0)).toHaveLength(1);
  expect(new ClusterIndex([0, 0, 45.000001, 0], options).getClusters(WORLD, 0)).toHaveLength(2);
  const chain = new ClusterIndex([0, 0, 40, 0, 80, 0], options);
  expect(chain.getClusters(WORLD, 0).map(node => node.pointCount)).toEqual([2, 1]);
  expect(new ClusterIndex([40, 0, 0, 0, 80, 0], options).getClusters(WORLD, 0)[0].pointCount).toBe(
    3
  );
  expect(new ClusterIndex([0, 0, 0, 0], {maxZoom: 30}).getClusters(WORLD, 30)[0].pointCount).toBe(
    2
  );
  // Keep bin coordinates and their radius halo below the safe-integer boundary.
  expect(
    () =>
      new ClusterIndex([0, -90], {
        maxZoom: 0,
        tileSize: 1,
        radiusPixels: 1 / Number.MAX_SAFE_INTEGER
      })
  ).toThrow('Invalid cluster radius');
});
