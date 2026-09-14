// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

import {TILE3D_OPTIMIZATION_HINT, TILE_REFINEMENT} from '../../constants';
import {TilesetTraverser} from '../common/tileset-traverser';
import type {Tile3D} from '../common/tile-3d';
import type {FrameState} from '../helpers/frame-state';

export class Tileset3DTraverser extends TilesetTraverser {
  /** Pending implicit subtree requests keyed by viewport and tile identity. */
  private readonly pendingImplicitSubtrees: Map<string, number> = new Map();

  /**
   * Reports whether every implicit subtree request started by this viewport traversal has settled.
   *
   * @param frameState - Traversal frame whose completion callback is being considered.
   * @returns `true` when no matching subtree metadata request remains pending.
   */
  protected traversalFinished(frameState: FrameState): boolean {
    const viewportPrefix = `${frameState.viewport.id}:`;
    for (const [requestKey, frameNumber] of this.pendingImplicitSubtrees) {
      if (requestKey.startsWith(viewportPrefix) && frameNumber === frameState.frameNumber) {
        return false;
      }
    }
    return true;
  }

  /**
   * Runs normal replacement traversal or the dedicated skip-LOD traversal selected by options.
   *
   * @param root - Root of the runtime subtree to traverse.
   * @param frameState - Current culling and LOD state.
   */
  executeTraversal(root: Tile3D, frameState: FrameState): void {
    if (!this.isSkipLevelOfDetailEnabled()) {
      super.executeTraversal(root, frameState);
      return;
    }
    this.executeSkipTraversal(root, frameState);
  }

  /**
   * Traverses visible replacement branches without requesting skipped intermediate content.
   *
   * Base-traversal tiles establish coarse coverage. Below that base, only final desired tiles and
   * tiles that cross the configured depth/SSE thresholds are requested. Already available
   * ancestors remain selectable while those requests stream in.
   *
   * @param root - Root of the runtime subtree to traverse.
   * @param frameState - Current culling and LOD state.
   */
  private executeSkipTraversal(root: Tile3D, frameState: FrameState): void {
    const stack: Tile3D[] = [root];
    root._selectionDepth = root.parent ? root.parent._selectionDepth : 1;

    while (stack.length > 0) {
      const tile = stack.pop() as Tile3D;
      const parentRefines = !tile.parent || tile.parent._shouldRefine;
      const shouldRefine =
        this.canTraverse(tile, frameState) &&
        this.updateAndPushSkipChildren(tile, frameState, stack) &&
        parentRefines;
      const stoppedRefining = !shouldRefine && parentRefines;

      if (!tile.hasRenderContent) {
        this.emptyTiles[tile.id] = tile;
        this.loadTile(tile, frameState);
        if (stoppedRefining) {
          this.selectDesiredTile(tile, frameState);
        }
      } else if (tile.refine === TILE_REFINEMENT.ADD) {
        this.loadTile(tile, frameState);
        this.selectDesiredTile(tile, frameState);
      } else if (tile.refine === TILE_REFINEMENT.REPLACE) {
        if (this.isInBaseTraversal(tile, frameState)) {
          this.loadTile(tile, frameState);
          if (stoppedRefining) {
            this.selectDesiredTile(tile, frameState);
          }
        } else if (stoppedRefining) {
          this.loadTile(tile, frameState);
          this.selectDesiredTile(tile, frameState);
        } else if (this.hasReachedSkippingThreshold(tile, frameState)) {
          this.loadTile(tile, frameState);
        }
      }

      this.touchTile(tile, frameState);
      tile._shouldRefine = shouldRefine;
    }

    this.completeTraversal(frameState);
  }

  /**
   * Updates and pushes visible children for skip traversal without requiring sibling readiness.
   *
   * @param tile - Parent whose children are considered.
   * @param frameState - Current culling and LOD state.
   * @param stack - Depth-first traversal stack.
   * @returns `true` when at least one visible child continues refinement.
   */
  private updateAndPushSkipChildren(
    tile: Tile3D,
    frameState: FrameState,
    stack: Tile3D[]
  ): boolean {
    this.updateChildTiles(tile, frameState);
    tile.children.sort(this.compareDistanceToCamera.bind(this));

    let hasVisibleChild = false;
    for (const child of tile.children) {
      child._selectionDepth = tile.hasRenderContent
        ? tile._selectionDepth + 1
        : tile._selectionDepth;
      if (child.isVisibleAndInRequestVolume) {
        stack.push(child);
        hasVisibleChild = true;
      } else if (this.options.loadSiblings) {
        this.loadTile(child, frameState);
        this.touchTile(child, frameState);
      }
    }
    return hasVisibleChild;
  }

  /**
   * Determines whether a tile belongs to the coarse non-skipping portion of the traversal.
   *
   * @param tile - Tile considered for loading.
   * @param frameState - Current traversal frame.
   * @returns `true` when the tile should always be requested for fallback coverage.
   */
  private isInBaseTraversal(tile: Tile3D, frameState: FrameState): boolean {
    if (this.options.immediatelyLoadDesiredLevelOfDetail) {
      return false;
    }
    if (!this.findNearestRequestedOrLoadedAncestor(tile, frameState)) {
      return true;
    }

    const configuredBaseScreenSpaceError = Number.isFinite(this.options.baseScreenSpaceError)
      ? Math.max(this.options.baseScreenSpaceError, 0)
      : 1024;
    const baseScreenSpaceError = Math.max(
      configuredBaseScreenSpaceError,
      tile.tileset.memoryAdjustedScreenSpaceError
    );
    if (tile._screenSpaceError === 0 && tile.parent) {
      return tile.parent._screenSpaceError > baseScreenSpaceError;
    }
    return tile._screenSpaceError > baseScreenSpaceError;
  }

  /**
   * Determines whether a skipped branch has crossed its configured request threshold.
   *
   * @param tile - Tile considered for loading.
   * @param frameState - Current traversal frame.
   * @returns `true` when the tile must be requested instead of skipped.
   */
  private hasReachedSkippingThreshold(tile: Tile3D, frameState: FrameState): boolean {
    if (this.options.immediatelyLoadDesiredLevelOfDetail) {
      return false;
    }
    const progressiveResolutionLeaf =
      tile._priorityProgressiveResolution &&
      tile._screenSpaceErrorProgressiveResolution <= tile.tileset.memoryAdjustedScreenSpaceError &&
      Boolean(
        tile.parent &&
          tile.parent._screenSpaceErrorProgressiveResolution >
            tile.tileset.memoryAdjustedScreenSpaceError
      );
    if (progressiveResolutionLeaf) {
      return true;
    }

    const ancestor = this.findNearestRequestedOrLoadedAncestor(tile, frameState);
    if (!ancestor) {
      return false;
    }
    const skipScreenSpaceErrorFactor =
      Number.isFinite(this.options.skipScreenSpaceErrorFactor) &&
      this.options.skipScreenSpaceErrorFactor > 0
        ? this.options.skipScreenSpaceErrorFactor
        : 16;
    const skipLevels = Number.isFinite(this.options.skipLevels)
      ? Math.max(Math.floor(this.options.skipLevels), 0)
      : 1;
    return (
      tile._screenSpaceError < ancestor._screenSpaceError / skipScreenSpaceErrorFactor &&
      tile.depth > ancestor.depth + skipLevels
    );
  }

  /**
   * Finds the nearest ancestor whose render content is loaded, loading, or requested this frame.
   *
   * @param tile - Descendant whose request threshold needs an anchor.
   * @param frameState - Current traversal frame.
   * @returns The nearest request anchor, or `null` when none exists.
   */
  private findNearestRequestedOrLoadedAncestor(
    tile: Tile3D,
    frameState: FrameState
  ): Tile3D | null {
    let ancestor = tile.parent;
    while (ancestor) {
      const contentIsUsableAnchor =
        ancestor.hasRenderContent &&
        !ancestor.contentFailed &&
        (!ancestor.hasUnloadedContent || ancestor._requestedFrame === frameState.frameNumber);
      if (contentIsUsableAnchor) {
        return ancestor;
      }
      ancestor = ancestor.parent;
    }
    return null;
  }

  /**
   * Selects the desired tile, its nearest ready ancestor, or nearby ready descendants.
   *
   * @param tile - Tile that ended the desired refinement branch.
   * @param frameState - Current culling state.
   */
  private selectDesiredTile(tile: Tile3D, frameState: FrameState): void {
    let fallbackTile: Tile3D | null = tile;
    while (fallbackTile) {
      if (this.shouldSelectTile(fallbackTile, frameState)) {
        this.selectTile(fallbackTile, frameState);
        return;
      }
      fallbackTile = fallbackTile.parent;
    }
    this.selectLoadedDescendants(tile, frameState);
  }

  /**
   * Selects ready descendants near an unavailable desired tile to reduce temporary empty regions.
   *
   * @param root - Unavailable tile whose descendants are searched.
   * @param frameState - Current culling state.
   */
  private selectLoadedDescendants(root: Tile3D, frameState: FrameState): void {
    const stack: Array<{tile: Tile3D; depth: number}> = [{tile: root, depth: 0}];
    while (stack.length > 0) {
      const {tile, depth} = stack.pop() as {tile: Tile3D; depth: number};
      for (const child of tile.children) {
        this.updateTile(child, frameState);
        if (!child.isVisibleAndInRequestVolume) {
          continue;
        }
        if (child.contentAvailable) {
          this.selectTile(child, frameState);
          this.touchTile(child, frameState);
        } else if (depth < 1) {
          stack.push({tile: child, depth: depth + 1});
        }
      }
    }
  }

  compareDistanceToCamera(a, b) {
    // Sort by farthest child first since this is going on a stack
    return b._distanceToCamera === 0 && a._distanceToCamera === 0
      ? b._centerZDepth - a._centerZDepth
      : b._distanceToCamera - a._distanceToCamera;
  }

  /**
   * Starts an implicit subtree request only after culling, request-volume, and SSE eligibility.
   *
   * The current parent remains the traversal boundary while metadata is loading, which preserves
   * REPLACE coverage and ADD accumulation. Request scheduling reads the tile's existing
   * progressive-resolution and foveated metrics, so subtree metadata follows the same priority
   * policy as render content. A completion notification lets the owning tileset publish the newly
   * materialized traversal result on the next update.
   *
   * @param tile - Tile whose existing or lazy children should be updated.
   * @param frameState - Current culling and LOD state.
   */
  updateChildTiles(tile: Tile3D, frameState: FrameState): void {
    if (
      tile.hasUnloadedChildren &&
      tile.isVisibleAndInRequestVolume &&
      this.shouldRefine(tile, frameState)
    ) {
      const requestKey = `${frameState.viewport.id}:${tile.id}`;
      if (!this.pendingImplicitSubtrees.has(requestKey)) {
        this.pendingImplicitSubtrees.set(requestKey, frameState.frameNumber);
        void tile.tileset._loadTileChildren(tile, frameState).finally(() => {
          this.handleImplicitSubtreeLoad(tile, frameState, requestKey);
        });
      }
    }
    super.updateChildTiles(tile, frameState);
  }

  /**
   * Resumes the same traversal frame after one lazy subtree request settles.
   *
   * Successful materialization traverses the new headers immediately. Failed or scheduler-cancelled
   * requests finish the current traversal without retrying in a tight loop; a later application
   * update may retry them.
   *
   * @param tile - Subtree-root tile whose request settled.
   * @param frameState - Frame that started the request.
   * @param requestKey - Viewport-scoped pending-request identity.
   */
  private handleImplicitSubtreeLoad(
    tile: Tile3D,
    frameState: FrameState,
    requestKey: string
  ): void {
    this.pendingImplicitSubtrees.delete(requestKey);
    if (this._frameNumber !== frameState.frameNumber) {
      return;
    }
    if (tile.childrenState === 'ready') {
      this.executeTraversal(tile, frameState);
    } else if (this.traversalFinished(frameState)) {
      this.options.onTraversalEnd(frameState);
    }
  }

  updateTileVisibility(tile, frameState) {
    super.updateTileVisibility(tile, frameState);

    //  Optimization - if none of the tile's children are visible then this tile isn't visible
    if (!tile.isVisibleAndInRequestVolume) {
      return;
    }

    const hasChildren = tile.children.length > 0;
    if (tile.hasTilesetContent && hasChildren) {
      // Use the root tile's visibility instead of this tile's visibility.
      // The root tile may be culled by the children bounds optimization in which
      // case this tile should also be culled.
      const firstChild = tile.children[0];
      this.updateTileVisibility(firstChild, frameState);
      tile._visible = firstChild._visible;
      return;
    }

    if (this.meetsScreenSpaceErrorEarly(tile, frameState)) {
      tile._visible = false;
      return;
    }

    const replace = tile.refine === TILE_REFINEMENT.REPLACE;
    const useOptimization =
      tile._optimChildrenWithinParent === TILE3D_OPTIMIZATION_HINT.USE_OPTIMIZATION;
    if (replace && useOptimization && hasChildren) {
      if (!this.anyChildrenVisible(tile, frameState)) {
        tile._visible = false;
        return;
      }
    }
  }

  meetsScreenSpaceErrorEarly(tile, frameState) {
    const {parent} = tile;
    if (!parent || parent.hasTilesetContent || parent.refine !== TILE_REFINEMENT.ADD) {
      return false;
    }

    // Use parent's geometric error with child's box to see if the tile already meet the SSE
    return !this.shouldRefine(tile, frameState, true);
  }
}
