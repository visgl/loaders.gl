import ManagedArray from '../../utils/managed-array';
import {TILE_REFINEMENT} from '../../constants';
import {assert} from '@loaders.gl/loader-utils';

export const DEFAULT_OPTIONS = {
  loadSiblings: false,
  skipLevelOfDetail: false,
  maximumScreenSpaceError: 2
};

export default class TilesetTraverser {
  // TODO nested props
  constructor(options) {
    this.options = {...DEFAULT_OPTIONS, ...options};
    // TRAVERSAL
    // temporary storage to hold the traversed tiles during a traversal
    this._traversalStack = new ManagedArray();
    this._emptyTraversalStack = new ManagedArray();

    // set in every traverse cycle
    this._frameNumber = null;

    // fulfill in traverse call
    this.root = null;

    // RESULT
    // tiles should be rendered
    this.selectedTiles = {};
    // tiles should be loaded from server
    this.requestedTiles = {};
    // tiles does not have render content
    this.emptyTiles = {};
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

  // execute traverse
  // Depth-first traversal that traverses all visible tiles and marks tiles for selection.
  // If skipLevelOfDetail is off then a tile does not refine until all children are loaded.
  // This is the traditional replacement refinement approach and is called the base traversal.
  // Tiles that have a greater screen space error than the base screen space error are part of the base traversal,
  // all other tiles are part of the skip traversal. The skip traversal allows for skipping levels of the tree
  // and rendering children and parent tiles simultaneously.
  /* eslint-disable-next-line complexity, max-statements */
  executeTraversal(root, frameState) {
    // stack to store traversed tiles, only visible tiles should be added to stack
    // visible: visible in the current view frustum
    const stack = this._traversalStack;

    stack.push(root);
    while (stack.length > 0) {
      // 1. pop tile
      const tile = stack.pop();

      // 2. check if tile needs to be refine, needs refine if a tile's LoD is not sufficient and tile has available children (available content)
      let shouldRefine = false;
      if (this.canTraverse(tile, frameState)) {
        this.updateChildTiles(tile, frameState);
        shouldRefine = this.updateAndPushChildren(tile, frameState, stack);
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

    if (this.options.onTraversalEnd) {
      this.options.onTraversalEnd(frameState);
    }
  }

  updateChildTiles(tile, frameState) {
    const children = tile.children;
    for (const child of children) {
      this.updateTile(child, frameState);
    }
    return true;
  }

  /* eslint-disable complexity, max-statements */
  updateAndPushChildren(tile, frameState, stack) {
    const {loadSiblings, skipLevelOfDetail} = this.options;

    const children = tile.children;

    // sort children tiles
    children.sort(this.compareDistanceToCamera);

    // For traditional replacement refinement only refine if all children are loaded.
    // Empty tiles are exempt since it looks better if children stream in as they are loaded to fill the empty space.
    const checkRefines =
      !skipLevelOfDetail && tile.refine === TILE_REFINEMENT.REPLACE && tile.hasRenderContent;

    let hasVisibleChild = false;
    for (const child of children) {
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

        if (!childRefines) {
          return childRefines;
        }
      }
    }

    return hasVisibleChild;
  }
  /* eslint-enable complexity, max-statements */

  updateTile(tile, frameState) {
    this.updateTileVisibility(tile, frameState);
  }

  // tile to render in the browser
  selectTile(tile, frameState) {
    if (this.shouldSelectTile(tile, frameState)) {
      // The tile can be selected right away and does not require traverseAndSelect
      tile._selectedFrame = frameState.frameNumber;
      this.selectedTiles[tile.id] = tile;
    }
  }

  // tile to load from server
  loadTile(tile, frameState) {
    if (this.shouldLoadTile(tile, frameState)) {
      tile._requestedFrame = frameState.frameNumber;
      tile._priority = this.getPriority(tile);
      this.requestedTiles[tile.id] = tile;
    }
  }

  // cache tile
  touchTile(tile, frameState) {
    tile.tileset._cache.touch(tile);
    tile._touchedFrame = frameState.frameNumber;
  }

  // tile should be visible
  // tile should have children
  // tile LoD (level of detail) is not sufficient under current viewport
  canTraverse(tile, frameState, useParentMetric = false, ignoreVisibility = false) {
    if (!ignoreVisibility && !tile.isVisibleAndInRequestVolume) {
      return false;
    }

    if (!tile.hasChildren) {
      return false;
    }

    // cesium specific
    if (tile.hasTilesetContent) {
      // Traverse external this to visit its root tile
      // Don't traverse if the subtree is expired because it will be destroyed
      return !tile.contentExpired;
    }

    return this.shouldRefine(tile, frameState, useParentMetric);
  }

  shouldLoadTile(tile, frameState) {
    // if request tile is in current frame
    // and has unexpired render content
    return tile.hasUnloadedContent || tile.contentExpired;
  }

  shouldSelectTile(tile, frameState) {
    // if select tile is in current frame
    // and content available
    return tile.contentAvailable && !this.options.skipLevelOfDetail;
  }

  // Decide if tile LoD (level of detail) is not sufficient under current viewport
  shouldRefine(tile, frameState, useParentMetric) {
    let screenSpaceError = tile._screenSpaceError;
    if (useParentMetric) {
      screenSpaceError = tile.getScreenSpaceError(frameState, true);
    }

    return screenSpaceError > this.options.maximumScreenSpaceError;
  }

  updateTileVisibility(tile, frameState) {
    tile.updateVisibility(frameState);
  }

  // UTILITIES

  compareDistanceToCamera(b, a) {
    return b._distanceToCamera - a._distanceToCamera;
  }

  // If skipLevelOfDetail is off try to load child tiles as soon as possible so that their parent can refine sooner.
  // Additive tiles are prioritized by distance because it subjectively looks better.
  // Replacement tiles are prioritized by screen space error.
  // A tileset that has both additive and replacement tiles may not prioritize tiles as effectively since SSE and distance
  // are different types of values. Maybe all priorities need to be normalized to 0-1 range.
  // TODO move to tile-3d-header
  getPriority(tile) {
    const {options} = this;
    switch (tile.refine) {
      case TILE_REFINEMENT.ADD:
        return tile._distanceToCamera;

      case TILE_REFINEMENT.REPLACE:
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

  anyChildrenVisible(tile, frameState) {
    let anyVisible = false;
    for (const child of tile.children) {
      child.updateVisibility(frameState);
      anyVisible = anyVisible || child.isVisibleAndInRequestVolume;
    }
    return anyVisible;
  }

  // TODO revisit this empty traversal logic
  // Depth-first traversal that checks if all nearest descendants with content are loaded.
  // Ignores visibility.
  executeEmptyTraversal(root, frameState) {
    let allDescendantsLoaded = true;
    const stack = this._emptyTraversalStack;

    while (stack.length > 0) {
      const tile = stack.pop();

      this.updateTile(tile, frameState);

      if (!tile.isVisibleAndInRequestVolume) {
        // Load tiles that aren't visible since they are still needed for the parent to refine
        this.loadTile(tile, frameState);
        this.touchTile(tile, frameState);
      }

      // Only traverse if the tile is empty - traversal stop at descendants with content
      const traverse = !tile.hasRenderContent && this.canTraverse(tile, frameState, false, true);

      // Traversal stops but the tile does not have content yet.
      // There will be holes if the parent tries to refine to its children, so don't refine.
      if (!traverse && !tile.contentAvailable) {
        allDescendantsLoaded = false;
      }

      if (traverse) {
        const children = tile.children.filter(c => c);
        for (const child of children) {
          // eslint-disable-next-line max-depth
          if (stack.find(child)) {
            stack.delete(child);
          }
          stack.push(child);
        }
      }
    }

    return allDescendantsLoaded;
  }
}

// TODO
// enable expiration
// enable optimization hint
