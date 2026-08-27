// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {
  intersectPointCloudBounds,
  selectPointCloudScanTiles,
  validatePointCloudQueryOptions,
  type PointCloudScanTile
} from '../../../src';

describe('validatePointCloudQueryOptions', () => {
  test('accepts table semantics with spatial and hierarchy constraints', () => {
    expect(() =>
      validatePointCloudQueryOptions(['X', 'Y', 'Z', 'Intensity'], {
        columns: ['X', 'Y', 'Z'],
        predicate: {op: '>=', args: [{property: 'Intensity'}, 10]},
        limit: 1000,
        bounds: {minimum: [0, 1, 2], maximum: [3, 4, 5]},
        minimumLevel: 2,
        maximumLevel: 8,
        targetSpacing: 0.5
      })
    ).not.toThrow();
  });

  test.each([
    [{bounds: {minimum: [2, 0, 0], maximum: [1, 1, 1]}}, /minimum cannot exceed/],
    [{minimumLevel: -1}, /minimumLevel/],
    [{minimumLevel: 3, maximumLevel: 2}, /cannot exceed/],
    [{targetSpacing: 0}, /positive finite/]
  ] as const)('rejects invalid point-cloud options', (options, expectedMessage) => {
    expect(() => validatePointCloudQueryOptions(['X'], options)).toThrow(expectedMessage);
  });
});

describe('selectPointCloudScanTiles', () => {
  const tiles: Record<string, PointCloudScanTile & {children: readonly string[]}> = {
    root: createTile('root', 0, 8, [0, 0, 0], [8, 8, 8], ['b', 'a']),
    a: createTile('a', 1, 4, [0, 0, 0], [4, 8, 8], ['a1']),
    b: createTile('b', 1, 4, [4, 0, 0], [8, 8, 8], ['b1']),
    a1: createTile('a1', 2, 2, [0, 0, 0], [4, 4, 4], []),
    b1: createTile('b1', 2, 2, [4, 0, 0], [8, 4, 4], [])
  };

  test('orders nodes, prunes bounds, and stops at target spacing', async () => {
    const selected: string[] = [];
    for await (const tile of selectPointCloudScanTiles(
      tiles.root,
      async tile => tile.children.map(childId => tiles[childId]),
      {
        bounds: {minimum: [0, 0, 0], maximum: [4, 8, 8]},
        minimumLevel: 1,
        targetSpacing: 4
      }
    )) {
      selected.push(tile.id);
    }
    expect(selected).toEqual(['a', 'b']);
  });

  test('honors maximum level and cancellation', async () => {
    const selected: string[] = [];
    for await (const tile of selectPointCloudScanTiles(
      tiles.root,
      async tile => tile.children.map(childId => tiles[childId]),
      {maximumLevel: 1}
    )) {
      selected.push(tile.id);
    }
    expect(selected).toEqual(['root', 'a', 'b']);

    const controller = new AbortController();
    controller.abort();
    const iterator = selectPointCloudScanTiles(tiles.root, async () => [], {
      signal: controller.signal
    });
    await expect(iterator.next()).rejects.toMatchObject({name: 'AbortError'});
  });

  test('tests inclusive three-dimensional intersections', () => {
    expect(
      intersectPointCloudBounds(
        {minimum: [0, 0, 0], maximum: [1, 1, 1]},
        {minimum: [1, 1, 1], maximum: [2, 2, 2]}
      )
    ).toBe(true);
    expect(
      intersectPointCloudBounds(
        {minimum: [0, 0, 0], maximum: [1, 1, 1]},
        {minimum: [2, 2, 2], maximum: [3, 3, 3]}
      )
    ).toBe(false);
  });
});

function createTile(
  id: string,
  level: number,
  geometricError: number,
  minimum: [number, number, number],
  maximum: [number, number, number],
  children: readonly string[]
): PointCloudScanTile & {children: readonly string[]} {
  return {id, level, geometricError, pointCount: 1, bounds: {minimum, maximum}, children};
}
