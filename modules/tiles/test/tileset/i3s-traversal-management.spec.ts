// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {I3STileManager} from '../../src/tileset-3d/format-i3s/i3s-tile-manager';
import {I3STilesetTraverser} from '../../src/tileset-3d/format-i3s/i3s-tileset-traverser';
import {Matrix4} from '@math.gl/core';
import {describe, expect, test, vi} from 'vitest';

const FRAME_STATE_1 = {frameNumber: 1, viewport: {id: 'main'}} as any;
const FRAME_STATE_2 = {frameNumber: 2, viewport: {id: 'secondary'}} as any;

describe('I3STileManager', () => {
  test('tracks successful requests and their latest frame state', async () => {
    const manager = new I3STileManager();
    let resolveRequest: (value: string) => void = () => {};
    const request = vi.fn(
      () =>
        new Promise<string>(resolve => {
          resolveRequest = resolve;
        })
    );
    const callback = vi.fn();

    manager.add(request, 'child-main', callback, FRAME_STATE_1);
    manager.add(request, 'child-main', callback, FRAME_STATE_1);
    expect(request).toHaveBeenCalledTimes(1);
    expect(manager.hasPendingTiles('main', 1)).toBe(true);
    expect(manager.find('child-main').status).toBe('REQUESTED');

    manager.update('missing', FRAME_STATE_2);
    manager.update('child-main', FRAME_STATE_2);
    expect(manager.hasPendingTiles('main', 1)).toBe(false);
    expect(manager.hasPendingTiles('secondary', 2)).toBe(true);

    resolveRequest('header');
    await vi.waitFor(() => expect(callback).toHaveBeenCalledWith('header', FRAME_STATE_1));
    expect(manager.find('child-main').status).toBe('COMPLETED');
    expect(manager.hasPendingTiles('secondary', 2)).toBe(false);
  });

  test('records rejected requests and clears their pending registration', async () => {
    const manager = new I3STileManager();
    const error = new Error('metadata failed');
    const callback = vi.fn();

    manager.add(() => Promise.reject(error), 'broken-main', callback, FRAME_STATE_1);
    await vi.waitFor(() => expect(callback).toHaveBeenCalledWith(error));

    expect(manager.find('broken-main').status).toBe('ERROR');
    expect(manager.hasPendingTiles('main', 1)).toBe(false);
    expect(manager.hasPendingTiles('missing', 99)).toBe(false);
  });
});

describe('I3STilesetTraverser', () => {
  test('reports pending traversal work and recognizes unconditional refinement', () => {
    const traverser = new I3STilesetTraverser({});
    const hasPendingTiles = vi.fn((viewportId: string) => viewportId === 'main');
    (traverser as any)._tileManager = {hasPendingTiles};
    (traverser as any)._frameNumber = 1;

    expect(traverser.traversalFinished(FRAME_STATE_1)).toBe(false);
    expect(traverser.traversalFinished(FRAME_STATE_2)).toBe(true);
    expect(hasPendingTiles).toHaveBeenCalledWith('main', 1);

    const tile = {lodMetricValue: 0};
    expect(traverser.shouldRefine(tile, FRAME_STATE_1)).toBe(true);
    expect(tile).toHaveProperty('_lodJudge', 'DIG');
  });

  test('loads, updates and traverses child headers according to cache state', () => {
    const traverser = new I3STilesetTraverser({});
    const add = vi.fn();
    const update = vi.fn();
    const cachedRequest = {frameState: FRAME_STATE_1};
    const find = vi.fn((key: string) => (key === 'cached-main' ? cachedRequest : undefined));
    (traverser as any)._tileManager = {add, update, find};
    traverser.updateTile = vi.fn();

    const availableChild = {id: 'available-main'};
    const tile = {
      header: {children: [{id: 'new'}, {id: 'cached'}, {id: 'available'}]},
      children: [availableChild]
    } as any;

    expect(traverser.updateChildTiles(tile, FRAME_STATE_1)).toBe(false);
    expect(add).toHaveBeenCalledTimes(1);
    expect(add.mock.calls[0][1]).toBe('new-main');
    expect(update).toHaveBeenCalledWith('cached-main', FRAME_STATE_1);
    expect(traverser.updateTile).toHaveBeenCalledWith(availableChild, FRAME_STATE_1);
  });

  test('delegates child header loading and validates source capabilities', async () => {
    const traverser = new I3STilesetTraverser({});
    const loadChildTileHeader = vi.fn(async (_tile, nodeId, frameState) => ({
      id: nodeId,
      frameNumber: frameState.frameNumber
    }));
    const tile = {tileset: {source: {loadChildTileHeader}}};

    await expect(traverser._loadTile(tile, 'child', FRAME_STATE_1)).resolves.toEqual({
      id: 'child',
      frameNumber: 1
    });
    expect(loadChildTileHeader).toHaveBeenCalledWith(tile, 'child', FRAME_STATE_1);
    await expect(
      traverser._loadTile({tileset: {source: {}}}, 'child', FRAME_STATE_1)
    ).rejects.toThrow(/does not support child tile header loading/);
  });

  test('forwards child-header failures to the source error callback', () => {
    const traverser = new I3STilesetTraverser({});
    const error = new Error('child failed');
    const onSourceError = vi.fn();
    const tile = {tileset: {_onSourceError: onSourceError}};

    traverser._onTileLoad(error, tile, 'child-main');
    expect(onSourceError).toHaveBeenCalledWith(error, tile);
  });

  test('materializes successful child headers and resumes a completed traversal', () => {
    const traverser = new I3STilesetTraverser({});
    const updateTile = vi.spyOn(traverser, 'updateTile').mockImplementation(() => {});
    const executeTraversal = vi.spyOn(traverser, 'executeTraversal').mockImplementation(() => {});
    vi.spyOn(traverser, 'traversalFinished').mockReturnValue(true);
    (traverser as any)._frameNumber = 1;

    const tileset = {
      modelMatrix: new Matrix4(),
      lodMetricType: 'maxScreenThreshold',
      lodMetricValue: 1,
      source: {},
      _onSourceError: vi.fn()
    };
    const parentTile = {
      id: 'parent',
      tileset,
      children: [],
      refine: 'REPLACE',
      depth: 0,
      computedTransform: new Matrix4()
    };
    const header = {
      id: 'child',
      lodMetricType: 'maxScreenThreshold',
      lodMetricValue: 1,
      boundingVolume: {sphere: [0, 0, 0, 1]},
      children: []
    };
    (traverser as any)._tileManager = {
      find: vi.fn(() => ({frameState: FRAME_STATE_1})),
      hasPendingTiles: vi.fn(() => false)
    };

    traverser._onTileLoad(header, parentTile, 'child-main');

    expect(parentTile.children).toHaveLength(1);
    expect(parentTile.children[0]).toMatchObject({id: 'child-main', parent: parentTile});
    expect(updateTile).toHaveBeenCalledWith(parentTile.children[0], FRAME_STATE_1);
    expect(executeTraversal).toHaveBeenCalledWith(parentTile.children[0], FRAME_STATE_1);
  });
});
