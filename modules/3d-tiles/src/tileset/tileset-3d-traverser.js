// import {TILE3D_REFINEMENT, TILE3D_OPTIMIZATION_HINT} from '../constants';
import {TILE3D_REFINEMENT} from '../constants';
import ManagedArray from '../utils/managed-array';
import assert from '../utils/assert';
// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

export default class Tileset3DTraverser {
  constructor() {
    this.traversal = {
      stack: new ManagedArray(),
      stackMaximumLength: 0
    };

    this.emptyTraversal = {
      stack: new ManagedArray(),
      stackMaximumLength: 0
    };

    this.result = {
      _requestedTiles: [],
      selectedTiles: [],
      _emptyTiles: [],
      _hasMixedContent: false
    };

    // Optimization option. Determines if level of detail skipping should be applied during the traversal.
    this._disableSkipLevelOfDetail = false;
  }

  traverse(root, frameState, options) {
    this.root = root; // for root screen space error
    this.options = options;

    this.result._requestedTiles.length = 0;
    this.result.selectedTiles.length = 0;
    this.result._emptyTiles.length = 0;
    // this.result._selectedTilesToStyle.length = 0;
    this.result._hasMixedContent = false;

    this.updateTile(root, frameState);

    // The root tile is not visible
    if (!root.isVisibleAndInRequestVolume) {
      return false;
    }

    // The this doesn't meet the SSE requirement, therefore the tree does not need to be rendered
    // The alwaysLoadRoot is better solved by moving the camera to the newly selected asset.
    if (root.getScreenSpaceError(frameState, true) <= options.maximumScreenSpaceError) {
      return false;
    }

    const baseScreenSpaceError = options.maximumScreenSpaceError;
    this.executeTraversal(root, baseScreenSpaceError, frameState);

    this.traversal.stack.trim(this.traversal.stackMaximumLength);
    this.emptyTraversal.stack.trim(this.emptyTraversal.stackMaximumLength);

    return true;
  }

  selectTile(tile, frameState) {
    tile._selectedFrame = frameState.frameNumber;
    this.result.selectedTiles.push(tile);

    // if (tile.contentVisibility(frameState) !== Intersect.OUTSIDE) {
    //   if (tile.content.featurePropertiesDirty) {
    //     // A feature's property in this tile changed, the tile needs to be re-styled.
    //     tile.content.featurePropertiesDirty = false;
    //     tile.lastStyleTime = 0; // Force applying the style to this tile
    //     tileset._selectedTilesToStyle.push(tile);
    //   } else if (tile._selectedFrame < frameState.frameNumber - 1) {
    //     // Tile is newly selected; it is selected this frame, but was not selected last frame.
    //     tileset._selectedTilesToStyle.push(tile);
    //   }
    //   tile._selectedFrame = frameState.frameNumber;
    //   tileset.selectedTiles.push(tile);
    // }
  }

  selectDesiredTile(tile, frameState) {
    if (!this.options.skipLevelOfDetail) {
      if (tile.contentAvailable) {
        // The tile can be selected right away and does not require traverseAndSelect
        this.selectTile(tile, frameState);
      }
      return;
    }

    // If this tile is not loaded attempt to select its ancestor instead
    const loadedTile = tile.contentAvailable ? tile : tile._ancestorWithContentAvailable;
    if (loadedTile) {
      // Tiles will actually be selected in traverseAndSelect
      loadedTile._shouldSelect = true;
    } else {
      // If no ancestors are ready traverse down and select tiles to minimize empty regions.
      // This happens often for immediatelyLoadDesiredLevelOfDetail where parent tiles
      // are not necessarily loaded before zooming out.
      this.selectDescendants(tile, frameState);
    }
  }

  visitTile(tileset, tile, frameState) {
    ++tileset._statistics.visited;
    tile._visitedFrame = frameState.frameNumber;
  }

  touchTile(tile, frameState) {
    // TODO need a better frameNumber since it can be the same between updates
    // Until then this needs to be commented out
    // if (tile._touchedFrame === frameState.frameNumber) {
    //   // Prevents another pass from touching the frame again
    //   return;
    // }
    // TODO: add function to tile that te
    tile.tileset._cache.touch(tile);
    tile._touchedFrame = frameState.frameNumber;
  }

  // If skipLevelOfDetail is off try to load child tiles as soon as possible so that their parent can refine sooner.
  // Additive tiles are prioritized by distance because it subjectively looks better.
  // Replacement tiles are prioritized by screen space error.
  // A tileset that has both additive and replacement tiles may not prioritize tiles as effectively since SSE and distance
  // are different types of values. Maybe all priorities need to be normalized to 0-1 range.
  getPriority(tile, options) {
    switch (tile.refine) {
      case TILE3D_REFINEMENT.ADD:
        return tile._distanceToCamera;

      case TILE3D_REFINEMENT.REPLACE:
        const {parent} = tile;
        const useParentScreenSpaceError =
          parent &&
          (!options.skipLevelOfDetail ||
            tile._screenSpaceError === 0.0 ||
            parent.hasTilesetContent);
        const screenSpaceError = useParentScreenSpaceError
          ? parent._screenSpaceError
          : tile._screenSpaceError;
        const rootScreenSpaceError = this.root._screenSpaceError;
        return rootScreenSpaceError - screenSpaceError; // Map higher SSE to lower values (e.g. root tile is highest priority)

      default:
        return assert(false);
    }
  }

  loadTile(tile, frameState) {
    if (tile.hasUnloadedContent || tile.contentExpired) {
      tile._requestedFrame = frameState.frameNumber;
      tile._priority = this.getPriority(tile, this.options);
      this.result._requestedTiles.push(tile);
    }
  }

  // anyChildrenVisible(tileset, tile, frameState) {
  //   let anyVisible = false;
  //   for (const child of tile.children) {
  //     child.updateVisibility(frameState);
  //     anyVisible = anyVisible || child.isVisibleAndInRequestVolume;
  //   }
  //   return anyVisible;
  // }

  // meetsScreenSpaceErrorEarly(tileset, tile, frameState) {
  //   const {parent} = tile;
  //   if (!parent || parent.hasTilesetContent || parent.refine !== TILE3D_REFINEMENT.ADD) {
  //     return false;
  //   }
  //
  //   // Use parent's geometric error with child's box to see if the tile already meet the SSE
  //   return tile.getScreenSpaceError(frameState, true) <= tileset.maximumScreenSpaceError;
  // }

  updateTileVisibility(tile, frameState) {
    tile.updateVisibility(frameState);

    // //  Optimization - if none of the tile's children are visible then this tile isn't visible
    // if (!tile.isVisibleAndInRequestVolume) {
    //   return;
    // }
    //
    // const hasChildren = tile.children.length > 0;
    // if (tile.hasTilesetContent && hasChildren) {
    //   // Use the root tile's visibility instead of this tile's visibility.
    //   // The root tile may be culled by the children bounds optimization in which
    //   // case this tile should also be culled.
    //   const firstChild = tile.children[0];
    //   this.updateTileVisibility(tileset, firstChild, frameState);
    //   tile._visible = firstChild._visible;
    //   return;
    // }
    //
    // if (this.meetsScreenSpaceErrorEarly(tileset, tile, frameState)) {
    //   tile._visible = false;
    //   return;
    // }
    //
    // const replace = tile.refine === TILE3D_REFINEMENT.REPLACE;
    // const useOptimization =
    //   tile._optimChildrenWithinParent === TILE3D_OPTIMIZATION_HINT.USE_OPTIMIZATION;
    // if (replace && useOptimization && hasChildren) {
    //   if (!this.anyChildrenVisible(tileset, tile, frameState)) {
    //     ++tileset._statistics.numberOfTilesCulledWithChildrenUnion;
    //     tile._visible = false;
    //     return;
    //   }
    // }
  }

  updateTile(tile, frameState) {
    this.updateTileVisibility(tile, frameState);
    tile.updateExpiration();
  }

  // eslint-disable-next-line complexity
  updateAndPushChildren(tile, stack, frameState) {
    const {children} = tile;

    for (const child of children) {
      this.updateTile(child, frameState);
      stack.push(child);
    }
    return true;

    // for (const child of children) {
    //   this.updateTile(child, frameState);
    // }
    //
    // function compareDistanceToCamera(a, b) {
    //   // Sort by farthest child first since this is going on a stack
    //   return b._distanceToCamera === 0 && a._distanceToCamera === 0
    //     ? b._centerZDepth - a._centerZDepth
    //     : b._distanceToCamera - a._distanceToCamera;
    // }
    //
    // // Sort by distance to take advantage of early Z and reduce artifacts for skipLevelOfDetail
    // children.sort(compareDistanceToCamera);
    //
    // // For traditional replacement refinement only refine if all children are loaded.
    // // Empty tiles are exempt since it looks better if children stream in as they are loaded to fill the empty space.
    // const checkRefines = !options.skipLevelOfDetail && tile.refine === TILE3D_REFINEMENT.REPLACE && tile.hasRenderContent
    // let refines = true;
    //
    // let anyChildrenVisible = false;
    // for (const child of children) {
    //   if (child.isVisibleAndInRequestVolume) {
    //     stack.push(child);
    //     anyChildrenVisible = true;
    //   } else if (checkRefines || options.loadSiblings) {
    //     // Keep non-visible children loaded since they are still needed before the parent can refine.
    //     // Or loadSiblings is true so always load tiles regardless of visibility.
    //     this.loadTile(child, frameState);
    //     this.touchTile(child, frameState);
    //   }
    //   if (checkRefines) {
    //     let childRefines;
    //     if (!child._inRequestVolume) {
    //       childRefines = false;
    //     } else if (!child.hasRenderContent) {
    //       childRefines = this.executeEmptyTraversal(child, frameState);
    //     } else {
    //       childRefines = child.contentAvailable;
    //     }
    //     refines = refines && childRefines;
    //   }
    // }
    //
    // if (!anyChildrenVisible) {
    //   refines = false;
    // }
    //
    // return refines;
  }

  canTraverse(tile, options) {
    // TODO: remove the depthLimit check once real sse is working
    if (tile.children.length === 0 || options.depthLimit < tile.depth) {
      return false;
    }

    if (tile.hasTilesetContent) {
      // Traverse external this to visit its root tile
      // Don't traverse if the subtree is expired because it will be destroyed
      return !tile.contentExpired;
    }

    return tile._screenSpaceError > options.maximumScreenSpaceError;
  }

  // Depth-first traversal that traverses all visible tiles and marks tiles for selection.
  // If skipLevelOfDetail is off then a tile does not refine until all children are loaded.
  // This is the traditional replacement refinement approach and is called the base traversal.
  // Tiles that have a greater screen space error than the base screen space error are part of the base traversal,
  // all other tiles are part of the skip traversal. The skip traversal allows for skipping levels of the tree
  // and rendering children and parent tiles simultaneously.

  // eslint-disable-next-line max-statements, complexity
  executeTraversal(root, baseScreenSpaceError, frameState) {
    const {traversal} = this;
    const {stack} = traversal;
    stack.push(root);

    while (stack.length > 0) {
      traversal.stackMaximumLength = Math.max(traversal.stackMaximumLength, stack.length);

      const tile = stack.pop();
      const add = tile.refine === TILE3D_REFINEMENT.ADD;
      const replace = tile.refine === TILE3D_REFINEMENT.REPLACE;
      const parent = tile.parent;
      const parentRefines = !parent || parent._refines;
      let refines = false;

      if (this.canTraverse(tile, this.options)) {
        refines = this.updateAndPushChildren(tile, stack, frameState) && parentRefines;
      }

      const stoppedRefining = !refines && parentRefines;

      if (!tile.hasRenderContent) {
        // Add empty tile just to show its debug bounding volume
        // If the tile has this content load the external this
        // If the tile cannot refine further select its nearest loaded ancestor
        this.result._emptyTiles.push(tile);
        this.loadTile(tile, frameState);
        if (stoppedRefining) {
          this.selectDesiredTile(tile, frameState);
        }
      } else if (add) {
        // Additive tiles are always loaded and selected
        this.loadTile(tile, frameState);
        this.selectDesiredTile(tile, frameState);
      } else if (replace) {
        // Always load tiles in the base traversal
        // Select tiles that can't refine further
        this.loadTile(tile, frameState);
        if (stoppedRefining) {
          this.selectDesiredTile(tile, frameState);
        }
      }

      // this.visitTile(tileset, tile, frameState);
      this.touchTile(tile, frameState);
      tile._refines = refines;
    }
  }

  // Depth-first traversal that checks if all nearest descendants with content are loaded. Ignores visibility.
  // executeEmptyTraversal(root, frameState) {
  //   const allDescendantsLoaded = true;
  //   const stack = emptyTraversal.stack;
  //   stack.push(root);
  //
  //   while (stack.length > 0) {
  //     emptyTraversal.stackMaximumLength = Math.max(emptyTraversal.stackMaximumLength, stack.length);
  //
  //     const tile = stack.pop();
  //     const children = tile.children;
  //     const childrenLength = children.length;
  //
  //     // Only traverse if the tile is empty - traversal stop at descendants with content
  //     const traverse = !tile.hasRenderContent && this.canTraverse(tile);
  //
  //     // Traversal stops but the tile does not have content yet.
  //     // There will be holes if the parent tries to refine to its children, so don't refine.
  //     if (!traverse && !tile.contentAvailable) {
  //       allDescendantsLoaded = false;
  //     }
  //
  //     this.updateTile(tile, frameState);
  //     if (!tile.isVisibleAndInRequestVolume) {
  //       // Load tiles that aren't visible since they are still needed for the parent to refine
  //       this.loadTile(tile, frameState);
  //       this.touchTile(tile, frameState);
  //     }
  //
  //     if (traverse) {
  //       for (const child of this.children) {
  //         stack.push(child);
  //       }
  //     }
  //   }
  //
  //   return allDescendantsLoaded;
  // }
}
