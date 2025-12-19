// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Tile3D} from './tile-3d';
import {ManagedArray} from '../utils/managed-array';
import {TILE_REFINEMENT} from '../constants';
import {FrameState} from './helpers/frame-state';

export type TilesetTraverserProps = {
  loadSiblings?: boolean;
  skipLevelOfDetail?: boolean;
  updateTransforms?: boolean;
  onTraversalEnd?: (frameState) => any;
  viewportTraversersMap?: Record<string, any>;
  basePath?: string;
};

export const DEFAULT_PROPS: Required<TilesetTraverserProps> = {
  loadSiblings: false,
  skipLevelOfDetail: false,
  updateTransforms: true,
  onTraversalEnd: () => {},
  viewportTraversersMap: {},
  basePath: ''
};

export class TilesetTraverser {
  options: Required<TilesetTraverserProps>;

  // fulfill in traverse call
  root: any = null;

  // tiles should be rendered
  selectedTiles: Record<string, Tile3D> = {};
  // tiles should be loaded from server
  requestedTiles: Record<string, Tile3D> = {};
  // tiles does not have render content
  emptyTiles: Record<string, Tile3D> = {};

  protected lastUpdate: number = new Date().getTime();
  protected readonly updateDebounceTime = 1000;
  /** temporary storage to hold the traversed tiles during a traversal */
  protected _traversalStack = new ManagedArray();
  protected _emptyTraversalStack = new ManagedArray();
  /** set in every traverse cycle */
  protected _frameNumber: number | null = null;

  // RESULT
  protected traversalFinished(frameState: FrameState): boolean {
    return true;
  }

  // TODO nested props
  constructor(options: TilesetTraverserProps) {
    this.options = {...DEFAULT_PROPS, ...options};
  }

  // tiles should be visible
  traverse(root, frameState, options) {
    this.root = root; // for root screen space error
    this.options = {...this.options, ...options};

    // reset result
    this.reset();

    // update tile (visibility and expiration)
    this.updateTile(root, frameState);

    this._frameNumber = frameState.frameNumber;
    this.executeTraversal(root, frameState);
  }

  reset() {
    this.requestedTiles = {};
    this.selectedTiles = {};
    this.emptyTiles = {};
    this._traversalStack.reset();
    this._emptyTraversalStack.reset();
  }

  /**
   * Execute traverse
   * Depth-first traversal that traverses all visible tiles and marks tiles for selection.
   * If skipLevelOfDetail is off then a tile does not refine until all children are loaded.
   * This is the traditional replacement refinement approach and is called the base traversal.
   * Tiles that have a greater screen space error than the base screen space error are part of the base traversal,
   * all other tiles are part of the skip traversal. The skip traversal allows for skipping levels of the tree
   * and rendering children and parent tiles simultaneously.
   */
  /* eslint-disable-next-line complexity, max-statements */
  executeTraversal(root, frameState: FrameState): void {
    // stack to store traversed tiles, only visible tiles should be added to stack
    // visible: visible in the current view frustum
    const stack = this._traversalStack;
    root._selectionDepth = 1;

    stack.push(root);
    while (stack.length > 0) {
      // 1. pop tile
      const tile = stack.pop();

      // 2. check if tile needs to be refine, needs refine if a tile's LoD is not sufficient and tile has available children (available content)
      let shouldRefine = false;
      if (this.canTraverse(tile, frameState)) {
        this.updateChildTiles(tile, frameState);
        shouldRefine = this.updateAndPushChildren(
          tile,
          frameState,
          stack,
          tile.hasRenderContent ? tile._selectionDepth + 1 : tile._selectionDepth
        );
      }

      // 3. decide if should render (select) this tile
      //   - tile does not have render content
      //   - tile has render content and tile is `add` type (pointcloud)
      //   - tile has render content and tile is `replace` type (photogrammetry) and can't refine any further
      const parent = tile.parent;
      const parentRefines = Boolean(!parent || parent._shouldRefine);
      const stoppedRefining = !shouldRefine;

      if (!tile.hasRenderContent) {
        this.emptyTiles[tile.id] = tile;
        this.loadTile(tile, frameState);
        if (stoppedRefining) {
          this.selectTile(tile, frameState);
        }
        // additive tiles
      } else if (tile.refine === TILE_REFINEMENT.ADD) {
        // Additive tiles are always loaded and selected
        this.loadTile(tile, frameState);
        this.selectTile(tile, frameState);

        // replace tiles
      } else if (tile.refine === TILE_REFINEMENT.REPLACE) {
        // Always load tiles in the base traversal
        // Select tiles that can't refine further
        this.loadTile(tile, frameState);
        if (stoppedRefining) {
          this.selectTile(tile, frameState);
        }
      }

      // 3. update cache, most recent touched tiles have higher priority to be fetched from server
      this.touchTile(tile, frameState);

      // 4. update tile refine prop and parent refinement status to trickle down to the descendants
      tile._shouldRefine = shouldRefine && parentRefines;
    }

    const newTime = new Date().getTime();
    if (this.traversalFinished(frameState) || newTime - this.lastUpdate > this.updateDebounceTime) {
      this.lastUpdate = newTime;
      this.options.onTraversalEnd(frameState);
    }
  }

  updateChildTiles(tile: Tile3D, frameState: FrameState): void {
    const children = tile.children;
    for (const child of children) {
      this.updateTile(child, frameState);
    }
  }

  /* eslint-disable complexity, max-statements */
  updateAndPushChildren(tile: Tile3D, frameState: FrameState, stack, depth): boolean {
    const {loadSiblings, skipLevelOfDetail} = this.options;

    const children = tile.children;

    // sort children tiles
    children.sort(this.compareDistanceToCamera.bind(this));

    // For traditional replacement refinement only refine if all children are loaded.
    // Empty tiles are exempt since it looks better if children stream in as they are loaded to fill the empty space.
    const checkRefines =
      tile.refine === TILE_REFINEMENT.REPLACE && tile.hasRenderContent && !skipLevelOfDetail;

    let hasVisibleChild = false;
    let refines = true;

    for (const child of children) {
      child._selectionDepth = depth;
      if (child.isVisibleAndInRequestVolume) {
        if (stack.find(child)) {
          stack.delete(child);
        }
        stack.push(child);
        hasVisibleChild = true;
      } else if (checkRefines || loadSiblings) {
        // Keep non-visible children loaded since they are still needed before the parent can refine.
        // Or loadSiblings is true so always load tiles regardless of visibility.
        this.loadTile(child, frameState);
        this.touchTile(child, frameState);
      }

      if (checkRefines) {
        let childRefines;
        if (!child._inRequestVolume) {
          childRefines = false;
        } else if (!child.hasRenderContent) {
          childRefines = this.executeEmptyTraversal(child, frameState);
        } else {
          childRefines = child.contentAvailable;
        }
        refines = refines && childRefines;

        if (!refines) {
          return false;
        }
      }
    }

    if (!hasVisibleChild) {
      refines = false;
    }
    return refines;
  }
  /* eslint-enable complexity, max-statements */

  updateTile(tile: Tile3D, frameState: FrameState): void {
    this.updateTileVisibility(tile, frameState);
  }

  // tile to render in the browser
  selectTile(tile: Tile3D, frameState: FrameState): void {
    if (this.shouldSelectTile(tile)) {
      // The tile can be selected right away and does not require traverseAndSelect
      tile._selectedFrame = frameState.frameNumber;
      this.selectedTiles[tile.id] = tile;
    }
  }

  // tile to load from server
  loadTile(tile: Tile3D, frameState: FrameState): void {
    if (this.shouldLoadTile(tile)) {
      tile._requestedFrame = frameState.frameNumber;
      tile._priority = tile._getPriority();
      this.requestedTiles[tile.id] = tile;
    }
  }

  // cache tile
  touchTile(tile: Tile3D, frameState: FrameState): void {
    tile.tileset._cache.touch(tile);
    tile._touchedFrame = frameState.frameNumber;
  }

  // tile should be visible
  // tile should have children
  // tile LoD (level of detail) is not sufficient under current viewport
  canTraverse(tile: Tile3D, frameState: FrameState): boolean {
    if (!tile.hasChildren) {
      return false;
    }

    // cesium specific
    if (tile.hasTilesetContent) {
      // Traverse external this to visit its root tile
      // Don't traverse if the subtree is expired because it will be destroyed
      return !tile.contentExpired;
    }

    return this.shouldRefine(tile, frameState);
  }

  shouldLoadTile(tile: Tile3D): boolean {
    // if request tile is in current frame
    // and has unexpired render content
    return tile.hasUnloadedContent || tile.contentExpired;
  }

  shouldSelectTile(tile: Tile3D): boolean {
    // if select tile is in current frame
    // and content available
    return tile.contentAvailable && !this.options.skipLevelOfDetail;
  }

  /** Decide if tile LoD (level of detail) is not sufficient under current viewport */
  shouldRefine(tile: Tile3D, frameState: FrameState, useParentMetric: boolean = false): boolean {
    let screenSpaceError = tile._screenSpaceError;
    if (useParentMetric) {
      screenSpaceError = tile.getScreenSpaceError(frameState, true);
    }

    return screenSpaceError > tile.tileset.memoryAdjustedScreenSpaceError;
  }

  updateTileVisibility(tile: Tile3D, frameState: FrameState): void {
    const viewportIds: string[] = [];
    if (this.options.viewportTraversersMap) {
      for (const key in this.options.viewportTraversersMap) {
        const value = this.options.viewportTraversersMap[key];
        if (value === frameState.viewport.id) {
          viewportIds.push(key);
        }
      }
    } else {
      viewportIds.push(frameState.viewport.id);
    }
    tile.updateVisibility(frameState, viewportIds);
  }

  // UTILITIES

  compareDistanceToCamera(b: Tile3D, a: Tile3D): number {
    return b._distanceToCamera - a._distanceToCamera;
  }

  anyChildrenVisible(tile: Tile3D, frameState: FrameState): boolean {
    let anyVisible = false;
    for (const child of tile.children) {
      // @ts-expect-error
      child.updateVisibility(frameState);
      // @ts-expect-error
      anyVisible = anyVisible || child.isVisibleAndInRequestVolume;
    }
    return anyVisible;
  }

  // Depth-first traversal that checks if all nearest descendants with content are loaded.
  // Ignores visibility.
  executeEmptyTraversal(root: Tile3D, frameState: FrameState): boolean {
    let allDescendantsLoaded = true;
    const stack = this._emptyTraversalStack;
    stack.push(root);

    while (stack.length > 0) {
      const tile = stack.pop();

      const traverse = !tile.hasRenderContent && this.canTraverse(tile, frameState);
      const emptyLeaf = !tile.hasRenderContent && tile.children.length === 0;

      // Traversal stops but the tile does not have content yet
      // There will be holes if the parent tries to refine to its children, so don't refine
      // One exception: a parent may refine even if one of its descendants is an empty leaf
      if (!traverse && !tile.contentAvailable && !emptyLeaf) {
        allDescendantsLoaded = false;
      }

      this.updateTile(tile, frameState);

      if (!tile.isVisibleAndInRequestVolume) {
        this.loadTile(tile, frameState);
        this.touchTile(tile, frameState);
      }

      if (traverse) {
        const children = tile.children;
        for (const child of children) {
          stack.push(child);
        }
      }
    }
    return allDescendantsLoaded;
  }
}
