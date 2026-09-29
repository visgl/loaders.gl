import {expect, test} from 'vitest';
import type {PointCloudTileHeader, PointCloudTilesetSource} from '@loaders.gl/tiles';
import {traversePointCloudSource} from '../../src/v5/point-cloud-source';

const ROOT_TILE: PointCloudTileHeader = {
  id: 'root',
  level: 0,
  pointCount: 1,
  geometricError: 10,
  boundingVolume: {
    cartographicBounds: [
      [0, 0, 0],
      [1, 1, 1]
    ],
    center: [0, 0, 0],
    radius: 1
  }
};

function createHeader(id: string, level: number): PointCloudTileHeader {
  return {...ROOT_TILE, id, level};
}

function createSource(
  childrenById: Readonly<Record<string, PointCloudTileHeader[]>>,
  calls: string[] = []
): PointCloudTilesetSource {
  return {
    isReady: false,
    initialize: async () => {
      calls.push('initialize');
    },
    getRootTile: async () => {
      calls.push('root');
      return ROOT_TILE;
    },
    getChildren: async tile => {
      calls.push(`children:${tile.id}`);
      return childrenById[tile.id] || [];
    },
    loadTileContent: async tile => {
      calls.push(`content:${tile.id}`);
      return null;
    }
  } as unknown as PointCloudTilesetSource;
}

test('traversePointCloudSource#visits reachable tiles once in deterministic depth-first order', async () => {
  const calls: string[] = [];
  const source = createSource(
    {
      root: [createHeader('left', 1), createHeader('right', 1)],
      left: [createHeader('leaf', 2)],
      right: [createHeader('leaf', 2)]
    },
    calls
  );

  const tiles = [];
  for await (const tile of traversePointCloudSource(source)) {
    tiles.push(tile);
  }

  expect(tiles.map(tile => tile.header.id)).toEqual(['root', 'left', 'leaf', 'right']);
  expect(tiles.every(tile => tile.content === null)).toBe(true);
  expect(calls).toEqual([
    'initialize',
    'root',
    'content:root',
    'children:root',
    'content:left',
    'children:left',
    'content:leaf',
    'children:leaf',
    'content:right',
    'children:right'
  ]);
});

test('traversePointCloudSource#limits traversal to the requested source level', async () => {
  const source = createSource({root: [createHeader('child', 1)], child: [createHeader('leaf', 2)]});
  const tileIds = [];

  for await (const tile of traversePointCloudSource(source, {maxDepth: 1})) {
    tileIds.push(tile.header.id);
  }

  expect(tileIds).toEqual(['root', 'child']);
});

test('traversePointCloudSource#retains decoded content and tile placement metadata', async () => {
  const content = {
    data: {} as never,
    pointCount: 1,
    cartographicOrigin: [10, 20, 30],
    coordinateSystem: 'cartesian' as const,
    modelMatrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
  };
  const source = {
    ...createSource({}),
    loadTileContent: async () => content
  } as unknown as PointCloudTilesetSource;
  const tiles = [];

  for await (const tile of traversePointCloudSource(source)) {
    tiles.push(tile);
  }

  expect(tiles).toEqual([{header: ROOT_TILE, content}]);
});

test('traversePointCloudSource#rejects invalid depth limits', async () => {
  const source = createSource({});

  await expect(async () => {
    for await (const _tile of traversePointCloudSource(source, {maxDepth: -1})) {
      // No tiles should be visited.
    }
  }).rejects.toThrow('maxDepth must be a non-negative integer');
});

test('traversePointCloudSource#honors cancellation before initializing a source', async () => {
  const calls: string[] = [];
  const source = createSource({}, calls);
  const controller = new AbortController();
  controller.abort();

  await expect(async () => {
    for await (const _tile of traversePointCloudSource(source, {signal: controller.signal})) {
      // No tiles should be visited.
    }
  }).rejects.toMatchObject({name: 'AbortError'});
  expect(calls).toEqual([]);
});

test('traversePointCloudSource#honors cancellation before loading child tiles', async () => {
  const calls: string[] = [];
  const source = createSource({root: [createHeader('child', 1)]}, calls);
  const controller = new AbortController();
  const traversal = traversePointCloudSource(source, {signal: controller.signal});

  await expect(traversal.next()).resolves.toMatchObject({value: {header: ROOT_TILE}});
  controller.abort();
  await expect(traversal.next()).rejects.toMatchObject({name: 'AbortError'});
  expect(calls).not.toContain('children:root');
});
