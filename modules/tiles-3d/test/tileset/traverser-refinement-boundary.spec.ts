// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test, vi} from 'vitest';
import {ManagedArray} from '../../src/utils/managed-array';
import {TILE_REFINEMENT} from '../../src/constants';
import {TilesetTraverser} from '../../src/tileset-3d/common/tileset-traverser';

/** Creates a deterministic tile contract for traversal without camera geometry. */
function createTile(id: string, overrides: Record<string, unknown> = {}): any {
  return {
    id,
    header: {},
    parent: null,
    children: [],
    refine: TILE_REFINEMENT.REPLACE,
    hasRenderContent: true,
    hasEmptyContent: false,
    hasChildren: false,
    hasTilesetContent: false,
    contentAvailable: true,
    contentExpired: false,
    hasUnloadedContent: false,
    priorityDeferred: false,
    isVisibleAndInRequestVolume: true,
    _inRequestVolume: true,
    _distanceToCamera: 0,
    _screenSpaceError: 0,
    _getPriority: vi.fn(() => 7),
    getScreenSpaceError: vi.fn(() => 20),
    contentVisibility: vi.fn(() => 'inside'),
    updateVisibility: vi.fn(),
    tileset: {memoryAdjustedScreenSpaceError: 10, _cache: {touch: vi.fn()}},
    ...overrides
  };
}

const FRAME_STATE = {frameNumber: 4, viewport: {id: 'primary'}} as any;

describe('TilesetTraverser replacement coverage boundaries', () => {
  test.each([
    true,
    false
  ])('keeps a replacement ancestor selected while desired content streams (skip=%s)', skip => {
    const child = createTile('child', {contentAvailable: false, hasUnloadedContent: true});
    const parent = createTile('parent', {
      hasChildren: true,
      children: [child],
      _screenSpaceError: 30
    });
    child.parent = parent;
    const onTraversalEnd = vi.fn();
    const traverser = new TilesetTraverser({skipLevelOfDetail: skip, onTraversalEnd});
    traverser.traverse(parent, FRAME_STATE, {});
    expect(Object.keys(traverser.selectedTiles)).toEqual(['parent']);
    expect(Object.keys(traverser.requestedTiles)).toEqual(['child']);
    expect(parent._shouldRefine).toBe(skip);
    expect(child._selectionDepth).toBe(2);
    expect(child._requestedFrame).toBe(4);
    expect(child._priority).toBe(7);
    expect(parent.tileset._cache.touch).toHaveBeenCalledWith(parent);
    expect(onTraversalEnd).toHaveBeenCalledWith(FRAME_STATE);
    child.contentAvailable = true;
    child.hasUnloadedContent = false;
    traverser.traverse(parent, FRAME_STATE, {});
    expect(Object.keys(traverser.requestedTiles)).toEqual([]);
    expect(Object.keys(traverser.selectedTiles)).toEqual(skip ? ['parent', 'child'] : ['child']);
  });

  test('sorts visible children once and removes duplicate stack entries before pushing', () => {
    const nearer = createTile('near', {_distanceToCamera: 1});
    const farther = createTile('far', {_distanceToCamera: 9});
    const parent = createTile('parent', {children: [farther, nearer]});
    const stack = new ManagedArray();
    stack.push(nearer);
    const traverser = new TilesetTraverser({});
    expect(traverser.updateAndPushChildren(parent, FRAME_STATE, stack, 3)).toBe(true);
    expect(parent.children).toEqual([nearer, farther]);
    expect(stack.length).toBe(2);
    expect(stack.pop()).toBe(farther);
    expect(stack.pop()).toBe(nearer);
    expect(nearer._selectionDepth).toBe(3);
  });

  test.each([
    true,
    false
  ])('loads in-volume hidden siblings, without allowing hidden-only refinement (siblings=%s)', loadSiblings => {
    const hidden = createTile('hidden', {
      isVisibleAndInRequestVolume: false,
      hasUnloadedContent: true
    });
    const parent = createTile('parent', {
      children: [hidden],
      refine: loadSiblings ? TILE_REFINEMENT.ADD : TILE_REFINEMENT.REPLACE
    });
    const traverser = new TilesetTraverser({loadSiblings});
    expect(traverser.updateAndPushChildren(parent, FRAME_STATE, new ManagedArray(), 2)).toBe(false);
    expect(traverser.requestedTiles.hidden).toBe(hidden);
    expect(hidden._touchedFrame).toBe(4);
    hidden._inRequestVolume = false;
    traverser.reset();
    expect(traverser.updateAndPushChildren(parent, FRAME_STATE, new ManagedArray(), 2)).toBe(false);
    expect(traverser.requestedTiles).toEqual({});
  });

  test('refines through proven empty leaves but waits at unresolved implicit subtree boundaries', () => {
    const empty = createTile('empty', {
      hasRenderContent: false,
      hasEmptyContent: true,
      contentAvailable: false
    });
    const parent = createTile('parent', {children: [empty]});
    const traverser = new TilesetTraverser({});
    expect(traverser.updateAndPushChildren(parent, FRAME_STATE, new ManagedArray(), 2)).toBe(true);
    empty.header.implicitSubtree = {subtreeUrl: '/pending'};
    expect(traverser.updateAndPushChildren(parent, FRAME_STATE, new ManagedArray(), 2)).toBe(false);
    delete empty.header.implicitSubtree;
    empty.hasEmptyContent = false;
    const missing = createTile('missing', {
      contentAvailable: false,
      hasUnloadedContent: true,
      isVisibleAndInRequestVolume: false
    });
    empty.children = [missing];
    empty.hasChildren = true;
    empty._screenSpaceError = 30;
    expect(traverser.executeEmptyTraversal(empty, FRAME_STATE)).toBe(false);
    expect(traverser.requestedTiles.missing).toBe(missing);
    missing.contentAvailable = true;
    missing.hasUnloadedContent = false;
    expect(traverser.executeEmptyTraversal(empty, FRAME_STATE)).toBe(true);
  });

  test('keeps additive ancestor and child selected, while empty ancestors preserve selection depth', () => {
    const child = createTile('child');
    const root = createTile('root', {
      refine: TILE_REFINEMENT.ADD,
      children: [child],
      hasChildren: true,
      _screenSpaceError: 30
    });
    child.parent = root;
    const traverser = new TilesetTraverser({});
    traverser.traverse(root, FRAME_STATE, {});
    expect(Object.keys(traverser.selectedTiles)).toEqual(['root', 'child']);
    root.hasRenderContent = false;
    root.contentAvailable = false;
    traverser.traverse(root, FRAME_STATE, {});
    expect(Object.keys(traverser.selectedTiles)).toEqual(['child']);
    expect(traverser.emptyTiles.root).toBe(root);
    expect(child._selectionDepth).toBe(1);
    root.children = [];
    root.hasChildren = false;
    traverser.traverse(root, FRAME_STATE, {});
    expect(traverser.selectedTiles).toEqual({});
  });

  test('uses parent SSE only when requested and selects content only within its content volume', () => {
    const tile = createTile('tile', {_screenSpaceError: 10});
    const traverser = new TilesetTraverser({skipLevelOfDetail: true});
    expect(traverser.shouldRefine(tile, FRAME_STATE)).toBe(false);
    expect(tile.getScreenSpaceError).not.toHaveBeenCalled();
    expect(traverser.shouldRefine(tile, FRAME_STATE, true)).toBe(true);
    expect(tile.getScreenSpaceError).toHaveBeenCalledWith(FRAME_STATE, true);
    expect(traverser.shouldSelectTile(tile, FRAME_STATE)).toBe(true);
    tile.contentVisibility.mockReturnValue('outside');
    expect(traverser.shouldSelectTile(tile, FRAME_STATE)).toBe(false);
    traverser.disableSkipLevelOfDetail = true;
    expect(traverser.isSkipLevelOfDetailEnabled()).toBe(false);
  });

  test('updates all child visibility and forwards only viewport IDs sharing the active traverser', () => {
    const hidden = createTile('hidden', {isVisibleAndInRequestVolume: false});
    const visible = createTile('visible');
    const root = createTile('root', {children: [hidden, visible]});
    const traverser = new TilesetTraverser({
      viewportTraversersMap: {primary: 'primary', mirror: 'primary', other: 'other'}
    });
    traverser.updateTileVisibility(root, FRAME_STATE);
    expect(root.updateVisibility).toHaveBeenCalledWith(FRAME_STATE, ['primary', 'mirror']);
    expect(traverser.anyChildrenVisible(root, FRAME_STATE)).toBe(true);
    expect(hidden.updateVisibility).toHaveBeenCalledWith(FRAME_STATE);
    expect(visible.updateVisibility).toHaveBeenCalledWith(FRAME_STATE);
    visible.isVisibleAndInRequestVolume = false;
    expect(traverser.anyChildrenVisible(root, FRAME_STATE)).toBe(false);
  });
});
