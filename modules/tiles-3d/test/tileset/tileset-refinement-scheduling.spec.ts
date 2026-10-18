// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test, vi} from 'vitest';
import {RequestScheduler} from '@loaders.gl/loader-utils';
import {advanceTimersAndFlush, withFakeTimers} from '@loaders.gl/test-utils/vitest';
import {Tile3D} from '../../src/tileset-3d/common/tile-3d';
import type {FrameState} from '../../src/tileset-3d/helpers/frame-state';
import {TilesetTraverser} from '../../src/tileset-3d/common/tileset-traverser';
import {ManagedArray} from '../../src/utils/managed-array';
import {TILE_CONTENT_STATE, TILE_REFINEMENT} from '../../src/constants';

/** Creates a replacement group with stable camera ordering and controlled readiness. */
function createReplacementGroup(ready: boolean[]) {
  const children = ready.map(
    (contentAvailable, index) =>
      ({
        id: `child-${index}`,
        contentAvailable,
        hasRenderContent: true,
        isVisibleAndInRequestVolume: true,
        _inRequestVolume: true,
        _distanceToCamera: 1
      }) as unknown as Tile3D
  );
  const parent = {
    children,
    refine: TILE_REFINEMENT.REPLACE,
    hasRenderContent: true
  } as unknown as Tile3D;
  const traverser = new TilesetTraverser({});
  const stack = new ManagedArray();
  const frameState = {} as FrameState;
  return {children, parent, traverser, stack, frameState};
}

/** Creates runtime tile states while keeping camera culling deterministic and network-free. */
function createTraversalGroup() {
  const traverser = new TilesetTraverser({});
  const tileset = {
    memoryAdjustedScreenSpaceError: 8,
    _cache: {touch: vi.fn()},
    _frameNumber: 1,
    _traverser: traverser
  };
  const createTile = (id: string, contentState: number): Tile3D =>
    Object.assign(Object.create(Tile3D.prototype), {
      id,
      header: {},
      parent: null,
      children: [],
      tileset,
      refine: TILE_REFINEMENT.REPLACE,
      contentState,
      hasEmptyContent: false,
      hasTilesetContent: false,
      _expiredContent: null,
      _visible: true,
      _inRequestVolume: true,
      _distanceToCamera: 1,
      _screenSpaceError: 0,
      _touchedFrame: 0,
      _foveatedFactor: 0,
      _priorityProgressiveResolution: false,
      priorityDeferred: false,
      contentVisibility: () => 'inside',
      updateVisibility: vi.fn()
    });
  const parent = createTile('parent', TILE_CONTENT_STATE.READY);
  parent._screenSpaceError = 100;
  const children = [0, 1, 2, 3].map(index => {
    const child = createTile(`child-${index}`, TILE_CONTENT_STATE.UNLOADED);
    child.parent = parent;
    return child;
  });
  parent.children = children;
  const frameState = {frameNumber: 1, viewport: {id: 'test'}} as FrameState;
  return {children, parent, traverser, tileset, frameState, createTile};
}

describe('replacement refinement scheduling', () => {
  test.each([0, 1, 2, 3])('discovers every sibling when child %i is unavailable', missingIndex => {
    const {children, parent, traverser, stack, frameState} = createReplacementGroup(
      [0, 1, 2, 3].map(index => index !== missingIndex)
    );

    expect(traverser.updateAndPushChildren(parent, frameState, stack, 2)).toBe(false);
    expect(stack.values.slice(0, stack.length)).toEqual(children);
    expect(children.map(child => child._selectionDepth)).toEqual([2, 2, 2, 2]);
  });

  test('discovers all cold children in one traversal and waits for complete replacement', () => {
    const {children, parent, traverser, stack, frameState} = createReplacementGroup([
      false,
      false,
      false,
      false
    ]);

    expect(traverser.updateAndPushChildren(parent, frameState, stack, 2)).toBe(false);
    expect(stack.length).toBe(4);
    for (const child of children) {
      Object.assign(child, {contentAvailable: true});
    }
    stack.reset();
    expect(traverser.updateAndPushChildren(parent, frameState, stack, 2)).toBe(true);
    expect(stack.length).toBe(4);
  });

  test('requests required offscreen siblings even after an unavailable visible child', () => {
    const {children, parent, traverser, stack, frameState} = createReplacementGroup([
      false,
      false,
      false,
      false
    ]);
    Object.assign(children[2], {isVisibleAndInRequestVolume: false});
    const loadTile = vi.spyOn(traverser, 'loadTile').mockImplementation(() => {});
    const touchTile = vi.spyOn(traverser, 'touchTile').mockImplementation(() => {});

    expect(traverser.updateAndPushChildren(parent, frameState, stack, 2)).toBe(false);
    expect(stack.length).toBe(3);
    expect(loadTile).toHaveBeenCalledWith(children[2], frameState);
    expect(touchTile).toHaveBeenCalledWith(children[2], frameState);
  });

  test('checks later empty branches and keeps replacement blocked outside request volume', () => {
    const {children, parent, traverser, stack, frameState} = createReplacementGroup([
      true,
      true,
      true,
      true
    ]);
    Object.assign(children[0], {
      _inRequestVolume: false,
      isVisibleAndInRequestVolume: false
    });
    Object.assign(children[3], {hasRenderContent: false});
    const emptyTraversal = vi.spyOn(traverser, 'executeEmptyTraversal').mockReturnValue(true);

    expect(traverser.updateAndPushChildren(parent, frameState, stack, 2)).toBe(false);
    expect(emptyTraversal).toHaveBeenCalledWith(children[3], frameState);
    expect(stack.values.slice(0, stack.length)).toEqual(children.slice(1));
  });

  test('keeps parent coverage until all children become available across complete traversals', () => {
    const {children, parent, traverser, tileset, frameState} = createTraversalGroup();

    traverser.traverse(parent, frameState, {});
    expect(Object.keys(traverser.requestedTiles).sort()).toEqual(children.map(child => child.id));
    expect(Object.keys(traverser.selectedTiles)).toEqual(['parent']);
    expect(parent._shouldRefine).toBe(false);

    children[3].contentState = TILE_CONTENT_STATE.READY;
    tileset._frameNumber = frameState.frameNumber = 2;
    traverser.traverse(parent, frameState, {});
    expect(Object.keys(traverser.requestedTiles).sort()).toEqual(['child-0', 'child-1', 'child-2']);
    expect(Object.keys(traverser.selectedTiles).sort()).toEqual(['child-3', 'parent']);
    expect(parent._shouldRefine).toBe(false);

    for (const child of children) {
      child.contentState = TILE_CONTENT_STATE.READY;
    }
    tileset._frameNumber = frameState.frameNumber = 3;
    traverser.traverse(parent, frameState, {});
    expect(Object.keys(traverser.requestedTiles)).toEqual([]);
    expect(Object.keys(traverser.selectedTiles).sort()).toEqual(children.map(child => child.id));
    expect(parent._shouldRefine).toBe(true);
  });

  test('discovers nested replacements while retaining coverage at both levels', () => {
    const {children, parent, traverser, tileset, frameState, createTile} = createTraversalGroup();
    const nestedParent = children[3];
    nestedParent.contentState = TILE_CONTENT_STATE.READY;
    nestedParent._screenSpaceError = 100;
    const descendants = [0, 1].map(index => {
      const descendant = createTile(`descendant-${index}`, TILE_CONTENT_STATE.UNLOADED);
      descendant.parent = nestedParent;
      return descendant;
    });
    nestedParent.children = descendants;

    traverser.traverse(parent, frameState, {});
    expect(Object.keys(traverser.requestedTiles).sort()).toEqual([
      'child-0',
      'child-1',
      'child-2',
      'descendant-0',
      'descendant-1'
    ]);
    expect(Object.keys(traverser.selectedTiles).sort()).toEqual(['child-3', 'parent']);
    expect(parent._shouldRefine).toBe(false);
    expect(nestedParent._shouldRefine).toBe(false);

    for (const child of children) {
      child.contentState = TILE_CONTENT_STATE.READY;
    }
    tileset._frameNumber = frameState.frameNumber = 2;
    traverser.traverse(parent, frameState, {});
    expect(Object.keys(traverser.requestedTiles).sort()).toEqual(descendants.map(tile => tile.id));
    expect(Object.keys(traverser.selectedTiles).sort()).toEqual(children.map(tile => tile.id));
    expect(parent._shouldRefine).toBe(true);
    expect(nestedParent._shouldRefine).toBe(false);

    for (const descendant of descendants) {
      descendant.contentState = TILE_CONTENT_STATE.READY;
    }
    tileset._frameNumber = frameState.frameNumber = 3;
    traverser.traverse(parent, frameState, {});
    expect(Object.keys(traverser.requestedTiles)).toEqual([]);
    expect(Object.keys(traverser.selectedTiles).sort()).toEqual([
      'child-0',
      'child-1',
      'child-2',
      'descendant-0',
      'descendant-1'
    ]);
    expect(nestedParent._shouldRefine).toBe(true);
  });

  test('continues discovery without requesting a later out-of-volume sibling', () => {
    const {children, parent, traverser, frameState} = createTraversalGroup();
    children[2]._inRequestVolume = false;

    traverser.traverse(parent, frameState, {});

    expect(Object.keys(traverser.requestedTiles).sort()).toEqual(['child-0', 'child-1', 'child-3']);
    expect(children[2]._touchedFrame).toBe(0);
    expect(Object.keys(traverser.selectedTiles)).toEqual(['parent']);
    expect(parent._shouldRefine).toBe(false);
  });

  test('bounds discovered requests and cancels queued children after zooming back out', async () => {
    await withFakeTimers(async () => {
      const {parent, traverser, tileset, frameState} = createTraversalGroup();
      const scheduler = new RequestScheduler({maxRequests: 2});
      traverser.traverse(parent, frameState, {});

      const requests = Object.values(traverser.requestedTiles).map(child => {
        child.contentState = TILE_CONTENT_STATE.LOADING;
        return scheduler.scheduleRequest(child.id, child._getPriority.bind(child));
      });
      expect(requests).toHaveLength(4);
      await advanceTimersAndFlush();
      expect(scheduler.activeRequestCount).toBe(2);
      const activeTokens = await Promise.all(requests.slice(0, 2));
      expect(activeTokens.every(Boolean)).toBe(true);

      parent._screenSpaceError = 0;
      tileset._frameNumber = frameState.frameNumber = 2;
      traverser.traverse(parent, frameState, {});
      expect(Object.keys(traverser.requestedTiles)).toEqual([]);
      expect(Object.keys(traverser.selectedTiles)).toEqual(['parent']);
      for (const token of activeTokens) {
        token?.done();
      }
      await advanceTimersAndFlush();
      expect(await Promise.all(requests.slice(2))).toEqual([null, null]);
      expect(scheduler.activeRequestCount).toBe(0);
    });
  });
});
