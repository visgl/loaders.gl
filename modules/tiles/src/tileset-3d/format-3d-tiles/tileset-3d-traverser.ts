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
