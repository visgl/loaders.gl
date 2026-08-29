// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {PointCloudTile} from '../../src/point-cloud/point-cloud-tile';
import {PointCloudTileset} from '../../src/point-cloud/point-cloud-tileset';

const volume = {
  cartographicBounds: [
    [-10, -5, 0],
    [10, 5, 10]
  ],
  center: [0, 0, 5],
  radius: 12
} as any;

/** Creates an isolated manager for exercising pure traversal helpers. */
function createManager() {
  const manager = Object.create(PointCloudTileset.prototype) as any;
  manager.options = {
    maxDepth: Infinity,
    minimumNodePixelSize: 150,
    lodSelectionMetricType: 'maxScreenThresholdSQ',
    densityThreshold: 1,
    pointBudget: 1000,
    onTileLoad: vi.fn(),
    onTileError: vi.fn(),
    onTraversalComplete: (tiles: unknown[]) => tiles,
    onUpdate: vi.fn()
  };
  manager.tilesMap = new Map();
  manager.selectedTiles = [];
  manager.pendingCount = 0;
  return manager;
}

test('point-cloud projection helpers handle invalid, degenerate, and clipped footprints', () => {
  const manager = createManager();
  expect(
    manager.projectBounds(volume, {
      project: () => {
        throw new Error('projection');
      }
    })
  ).toBeNull();
  expect(manager.projectBounds(volume, {project: () => [NaN, NaN]})).toBeNull();
  expect(
    manager.getProjectedFootprint(volume, {
      project: () => {
        throw new Error('projection');
      }
    })
  ).toBeNull();
  expect(manager.getProjectedFootprint(volume, {project: () => [Infinity, 0]})).toBeNull();

  const footprint = manager.getProjectedFootprint(volume, {project: () => [4, 5]});
  expect(footprint).toEqual({x: 4, y: 5, radius: 0});
  expect(manager.isProjectedFootprintVisible(footprint, {width: 10, height: 10})).toBe(true);
  expect(
    manager.isProjectedFootprintVisible({x: -100, y: 0, radius: 1}, {width: 10, height: 10})
  ).toBe(false);
  expect(
    manager.isProjectedFootprintVisible({x: 100, y: 0, radius: 1}, {width: 10, height: 10})
  ).toBe(false);
  expect(
    manager.isProjectedFootprintVisible({x: 0, y: -100, radius: 1}, {width: 10, height: 10})
  ).toBe(false);
  expect(
    manager.isProjectedFootprintVisible({x: 0, y: 100, radius: 1}, {width: 10, height: 10})
  ).toBe(false);
});

test('point-cloud zoom and corner helpers cover coordinate frames and longitude wrapping', () => {
  const manager = createManager();
  expect(manager.estimateZoom(null)).toBe(1);
  expect(manager.estimateZoom({...volume, coordinateFrame: 'cartesian'})).toBe(1);
  expect(manager.estimateZoom({...volume, coversFullLongitude: true})).toBe(1);
  expect(
    manager.estimateZoom({
      ...volume,
      wrapsDateline: true,
      cartographicBounds: [
        [170, -5, 0],
        [-170, 5, 10]
      ]
    })
  ).toBeGreaterThan(1);
  expect(manager.estimateZoom(volume)).toBeGreaterThan(1);

  expect(manager.getBoundingVolumeCorners({...volume, coversFullLongitude: true})).toHaveLength(8);
  expect(
    manager.getBoundingVolumeCorners({
      ...volume,
      wrapsDateline: true,
      cartographicBounds: [
        [170, -5, 0],
        [-170, 5, 10]
      ]
    })
  ).toHaveLength(16);
  expect(manager.getBoundingVolumeCorners(volume)).toHaveLength(8);
});

test('point-cloud culling helpers reject incomplete projections and accept complete frusta', () => {
  const manager = createManager();
  expect(manager.getCullingVolume({})).toBeNull();
  expect(
    manager.getCullingVolume({getFrustumPlanes: () => ({left: {normal: [1, 0, 0], distance: 0}})})
  ).toBeNull();
  const planes = Object.fromEntries(
    ['left', 'right', 'bottom', 'top', 'near', 'far'].map(name => [
      name,
      {normal: [1, 0, 0], distance: 0}
    ])
  );
  expect(manager.getCullingVolume({getFrustumPlanes: () => planes})).not.toBeNull();

  expect(manager.getCommonSpaceBoundingSphere(volume, {})).toBeNull();
  expect(
    manager.getCommonSpaceBoundingSphere(volume, {
      projectPosition: () => {
        throw new Error('projection');
      }
    })
  ).toBeNull();
  expect(
    manager.getCommonSpaceBoundingSphere(volume, {projectPosition: () => [NaN, 0, 0]})
  ).toBeNull();
  expect(
    manager.getCommonSpaceBoundingSphere(volume, {
      projectPosition: (position: number[]) => position
    })
  ).not.toBeNull();
});

test('point-cloud tile cache updates existing nodes and avoids duplicate children', () => {
  const manager = createManager();
  const parentHeader = {
    id: 'parent',
    level: 0,
    pointCount: 1,
    geometricError: 1,
    boundingVolume: volume
  };
  const childHeader = {
    id: 'child',
    level: 1,
    pointCount: 1,
    geometricError: 0,
    boundingVolume: volume
  };
  const parent = manager.getOrCreateTile(parentHeader, null) as PointCloudTile;
  const child = manager.getOrCreateTile(childHeader, parent) as PointCloudTile;
  expect(parent.children).toEqual([child]);

  const nextParent = new PointCloudTile({...parentHeader, id: 'next-parent'}, null);
  const updated = manager.getOrCreateTile({...childHeader, pointCount: 2}, nextParent);
  expect(updated).toBe(child);
  expect(updated.pointCount).toBe(2);
  expect(updated.parent).toBe(nextParent);
  manager.getOrCreateTile({...childHeader, pointCount: 3}, nextParent);
  expect(nextParent.children).toHaveLength(0);
  expect(parent.children).toEqual([child]);
});

test('point-cloud tile loading handles empty, successful, failed, and already-settled content', async () => {
  const manager = createManager();
  const header = {id: 'tile', level: 0, pointCount: 1, geometricError: 0, boundingVolume: volume};
  const tile = new PointCloudTile(header, null);
  manager.dataSource = {loadTileContent: vi.fn(async () => null)};
  await manager.loadTile(tile);
  expect(tile.contentAvailable).toBe(true);
  expect(manager.options.onTileLoad).not.toHaveBeenCalled();
  await manager.loadTile(tile);
  expect(manager.dataSource.loadTileContent).toHaveBeenCalledOnce();

  const loadedTile = new PointCloudTile({...header, id: 'loaded'}, null);
  manager.dataSource = {loadTileContent: vi.fn(async () => ({data: {}}))};
  await manager.loadTile(loadedTile);
  expect(manager.options.onTileLoad).toHaveBeenCalledWith(loadedTile);

  const failedTile = new PointCloudTile({...header, id: 'failed'}, null);
  const error = new Error('tile failed');
  manager.dataSource = {
    loadTileContent: vi.fn(async () => {
      throw error;
    })
  };
  await manager.loadTile(failedTile);
  expect(failedTile.contentFailed).toBe(true);
  expect(manager.options.onTileError).toHaveBeenCalledWith(failedTile, error);
  expect(manager.pendingCount).toBe(0);
});

test('point-cloud set comparisons cover equal, missing, and differently sized selections', () => {
  const manager = createManager();
  expect(manager.haveSameIds(new Set(['a']), new Set(['a']))).toBe(true);
  expect(manager.haveSameIds(new Set(['a']), new Set(['b']))).toBe(false);
  expect(manager.haveSameIds(new Set(['a']), new Set(['a', 'b']))).toBe(false);
});
