// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

import {TILE3D_OPTIMIZATION_HINT, TILE_REFINEMENT} from '../../constants';
import TilesetTraverser from './tileset-traverser';

export default class Tileset3DTraverser extends TilesetTraverser {
  compareDistanceToCamera(a, b) {
    // Sort by farthest child first since this is going on a stack
    return b._distanceToCamera === 0 && a._distanceToCamera === 0
      ? b._centerZDepth - a._centerZDepth
      : b._distanceToCamera - a._distanceToCamera;
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
