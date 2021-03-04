// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md
import {Vector3, Matrix4} from '@math.gl/core';
import {CullingVolume} from '@math.gl/culling';

import {load} from '@loaders.gl/core';
import {assert, path} from '@loaders.gl/loader-utils';
import {TILE_REFINEMENT, TILE_CONTENT_STATE, TILESET_TYPE} from '../constants';

import {createBoundingVolume} from './helpers/bounding-volume';
import {getTiles3DScreenSpaceError} from './helpers/tiles-3d-lod';
import {getI3ScreenSize} from './helpers/i3s-lod';

const scratchVector = new Vector3();

function defined(x) {
  return x !== undefined && x !== null;
}

// A Tile3DHeader represents a tile as Tileset3D. When a tile is first created, its content is not loaded;
// the content is loaded on-demand when needed based on the view.
// Do not construct this directly, instead access tiles through {@link Tileset3D#tileVisible}.
export default class TileHeader {
  // eslint-disable-next-line max-statements
  constructor(tileset, header, parentHeader) {
    assert(typeof header === 'object');

    // PUBLIC MEMBERS
    // original tile data
    this.header = header;
    // The tileset containing this tile.
    this.tileset = tileset;
    this.id = header.id;
    this.url = header.url;
    // This tile's parent or `undefined` if this tile is the root.
    this.parent = parentHeader;
    this.refine = this._getRefine(header.refine);
    this.type = header.type;
    this.contentUrl = header.contentUrl;
    // The error, in meters, introduced if this tile is rendered and its children are not.
    this.lodMetricType = null;
    this.lodMetricValue = null;
    // Specifies the type of refine that is used when traversing this tile for rendering.
    this.boundingVolume = null;
    // The tile's content.  This represents the actual tile's payload,
    // not the content's metadata in the tileset JSON file.
    this.content = null;
    this.contentState = TILE_CONTENT_STATE.UNLOADED;
    this.gpuMemoryUsageInBytes = 0;
    // The tile's children - an array of Tile3D objects.
    this.children = [];

    this.depth = 0;

    // PRIVATE MEMBERS
    this._cacheNode = null;
    this._frameNumber = null;
    this._cacheNode = null;

    this._initializeLodMetric(header);
    this._initializeTransforms(header);
    this._initializeBoundingVolumes(header);
    this._initializeContent(header);
    this._initializeRenderingState(header);

    // TODO i3s specific, needs to remove
    this._lodJudge = null;

    // TODO Cesium 3d tiles specific
    this._expireDate = null;
    this._expiredContent = null;

    this._getPriority = this._getPriority.bind(this);

    Object.seal(this);
  }

  destroy() {
    this.header = null;
  }

  isDestroyed() {
    return this.header === null;
  }

  get selected() {
    return this._selectedFrame === this.tileset._frameNumber;
  }

  get isVisible() {
    return this._visible;
  }

  get isVisibleAndInRequestVolume() {
    return this._visible && this._inRequestVolume;
  }

  // Returns true if tile is not an empty tile and not an external tileset
  get hasRenderContent() {
    return !this.hasEmptyContent && !this.hasTilesetContent;
  }

  get hasChildren() {
    return this.children.length > 0 || (this.header.children && this.header.children.length > 0);
  }

  // Determines if the tile's content is ready. This is automatically `true` for
  // tile's with empty content.
  get contentReady() {
    return this.contentState === TILE_CONTENT_STATE.READY || this.hasEmptyContent;
  }

  // Determines if the tile has available content to render.  `true` if the tile's
  // content is ready or if it has expired content this renders while new content loads; otherwise,
  get contentAvailable() {
    return Boolean(
      (this.contentReady && this.hasRenderContent) || (this._expiredContent && !this.contentFailed)
    );
  }

  // Returns true if tile has renderable content but it's unloaded
  get hasUnloadedContent() {
    return this.hasRenderContent && this.contentUnloaded;
  }

  // Determines if the tile's content has not be requested. `true` if tile's
  // content has not be requested; otherwise, `false`.
  get contentUnloaded() {
    return this.contentState === TILE_CONTENT_STATE.UNLOADED;
  }

  // Determines if the tile's content is expired. `true` if tile's
  // content is expired; otherwise, `false`.
  get contentExpired() {
    return this.contentState === TILE_CONTENT_STATE.EXPIRED;
  }

  // Determines if the tile's content failed to load.  `true` if the tile's
  // content failed to load; otherwise, `false`.
  get contentFailed() {
    return this.contentState === TILE_CONTENT_STATE.FAILED;
  }

  // Get the tile's screen space error.
  getScreenSpaceError(frameState, useParentLodMetric) {
    switch (this.tileset.type) {
      case TILESET_TYPE.I3S:
        return getI3ScreenSize(this, frameState);
      case TILESET_TYPE.TILES3D:
        return getTiles3DScreenSpaceError(this, frameState, useParentLodMetric);
      default:
        // eslint-disable-next-line
        console.error('Unsupported tileset type');
        return null;
    }
  }

  _getPriority() {
    // Check if any reason to abort
    if (!this.isVisible) {
      return -1;
    }
    if (this.contentState === TILE_CONTENT_STATE.UNLOADED) {
      return -1;
    }

    return Math.max(1e7 - this._priority, 0) || 0;
  }

  // Requests the tile's content.
  // The request may not be made if the Request Scheduler can't prioritize it.
  // eslint-disable-next-line max-statements
  async loadContent() {
    if (this.hasEmptyContent) {
      return false;
    }

    if (this.content) {
      return true;
    }

    const expired = this.contentExpired;

    if (expired) {
      this._expireDate = null;
    }

    this.contentState = TILE_CONTENT_STATE.LOADING;

    const requestToken = await this.tileset._requestScheduler.scheduleRequest(
      this.id,
      this._getPriority
    );

    if (!requestToken) {
      // cancelled
      this.contentState = TILE_CONTENT_STATE.UNLOADED;
      return false;
    }

    try {
      const contentUrl = this.tileset.getTileUrl(this.contentUrl);
      // The content can be a binary tile ot a JSON tileset
      const fetchOptions = this.tileset.fetchOptions;
      const loader = this.tileset.loader;
      const options = {
        ...fetchOptions,
        [loader.id]: {
          tile: this.header,
          tileset: this.tileset.tileset,
          isTileset: 'auto',
          isTileHeader: false,
          assetGltfUpAxis: this.tileset.asset.gltfUpAxis
        }
      };

      this.content = await load(contentUrl, loader, options);
      if (this._isTileset()) {
        // Add tile headers for the nested tilset's subtree
        // Async update of the tree should be fine since there would never be edits to the same node
        // TODO - we need to capture the child tileset's URL
        this.tileset._initializeTileHeaders(this.content, this, path.dirname(this.contentUrl));
      }

      this.contentState = TILE_CONTENT_STATE.READY;
      this._onContentLoaded();
      return true;
    } catch (error) {
      // Tile is unloaded before the content finishes loading
      this.contentState = TILE_CONTENT_STATE.FAILED;
      throw error;
    } finally {
      requestToken.done();
    }
  }

  // Unloads the tile's content.
  unloadContent() {
    if (this.content && this.content.destroy) {
      this.content.destroy();
    }
    this.content = null;
    this.contentState = TILE_CONTENT_STATE.UNLOADED;
    return true;
  }

  // Update the tile's visibility.
  updateVisibility(frameState) {
    if (this._frameNumber === frameState.frameNumber) {
      // Return early if visibility has already been checked during the traversal.
      // The visibility may have already been checked if the cullWithChildrenBounds optimization is used.
      return;
    }

    const parent = this.parent;
    const parentTransform = parent ? parent.computedTransform : this.tileset.modelMatrix;
    const parentVisibilityPlaneMask = parent
      ? parent._visibilityPlaneMask
      : CullingVolume.MASK_INDETERMINATE;

    this._updateTransform(parentTransform);
    this._distanceToCamera = this.distanceToTile(frameState);
    this._screenSpaceError = this.getScreenSpaceError(frameState, false);
    this._visibilityPlaneMask = this.visibility(frameState, parentVisibilityPlaneMask); // Use parent's plane mask to speed up visibility test
    this._visible = this._visibilityPlaneMask !== CullingVolume.MASK_OUTSIDE;
    this._inRequestVolume = this.insideViewerRequestVolume(frameState);

    this._priority = this.lodMetricValue;
    this._frameNumber = frameState.frameNumber;
  }

  // Determines whether the tile's bounding volume intersects the culling volume.
  // @param {FrameState} frameState The frame state.
  // @param {Number} parentVisibilityPlaneMask The parent's plane mask to speed up the visibility check.
  // @returns {Number} A plane mask as described above in {@link CullingVolume#computeVisibilityWithPlaneMask}.
  visibility(frameState, parentVisibilityPlaneMask) {
    const {cullingVolume} = frameState;
    const {boundingVolume} = this;

    // TODO Cesium specific - restore clippingPlanes
    // const {clippingPlanes, clippingPlanesOriginMatrix} = tileset;
    // if (clippingPlanes && clippingPlanes.enabled) {
    //   const intersection = clippingPlanes.computeIntersectionWithBoundingVolume(
    //     boundingVolume,
    //     clippingPlanesOriginMatrix
    //   );
    //   this._isClipped = intersection !== Intersect.INSIDE;
    //   if (intersection === Intersect.OUTSIDE) {
    //     return CullingVolume.MASK_OUTSIDE;
    //   }
    // }

    // return cullingVolume.computeVisibilityWithPlaneMask(boundingVolume, parentVisibilityPlaneMask);
    return cullingVolume.computeVisibilityWithPlaneMask(boundingVolume, parentVisibilityPlaneMask);
  }

  // Assuming the tile's bounding volume intersects the culling volume, determines
  // whether the tile's content's bounding volume intersects the culling volume.
  // @param {FrameState} frameState The frame state.
  // @returns {Intersect} The result of the intersection: the tile's content is completely outside, completely inside, or intersecting the culling volume.
  contentVisibility(frameState) {
    return true;

    // TODO restore
    /*
    // Assumes the tile's bounding volume intersects the culling volume already, so
    // just return Intersect.INSIDE if there is no content bounding volume.
    if (!defined(this.contentBoundingVolume)) {
      return Intersect.INSIDE;
    }

    if (this._visibilityPlaneMask === CullingVolume.MASK_INSIDE) {
      // The tile's bounding volume is completely inside the culling volume so
      // the content bounding volume must also be inside.
      return Intersect.INSIDE;
    }

    // PERFORMANCE_IDEA: is it possible to burn less CPU on this test since we know the
    // tile's (not the content's) bounding volume intersects the culling volume?
    const cullingVolume = frameState.cullingVolume;
    const boundingVolume = tile.contentBoundingVolume;

    const tileset = this.tileset;
    const clippingPlanes = tileset.clippingPlanes;
    if (defined(clippingPlanes) && clippingPlanes.enabled) {
      const intersection = clippingPlanes.computeIntersectionWithBoundingVolume(
        boundingVolume,
        tileset.clippingPlanesOriginMatrix
      );
      this._isClipped = intersection !== Intersect.INSIDE;
      if (intersection === Intersect.OUTSIDE) {
        return Intersect.OUTSIDE;
      }
    }

    return cullingVolume.computeVisibility(boundingVolume);
    */
  }

  // Computes the (potentially approximate) distance from the closest point of the tile's bounding volume to the camera.
  // @param {FrameState} frameState The frame state.
  // @returns {Number} The distance, in meters, or zero if the camera is inside the bounding volume.
  distanceToTile(frameState) {
    const boundingVolume = this.boundingVolume;
    return Math.sqrt(Math.max(boundingVolume.distanceSquaredTo(frameState.camera.position), 0));
  }

  // Computes the tile's camera-space z-depth.
  // @param {FrameState} frameState The frame state.
  // @returns {Number} The distance, in meters.
  cameraSpaceZDepth({camera}) {
    const boundingVolume = this.boundingVolume; // Gets the underlying OrientedBoundingBox or BoundingSphere
    scratchVector.subVectors(boundingVolume.center, camera.position);
    return camera.direction.dot(scratchVector);
  }

  /**
   * Checks if the camera is inside the viewer request volume.
   * @param {FrameState} frameState The frame state.
   * @returns {Boolean} Whether the camera is inside the volume.
   */
  insideViewerRequestVolume(frameState) {
    const viewerRequestVolume = this._viewerRequestVolume;
    return (
      !viewerRequestVolume ||
      viewerRequestVolume.distanceToCamera(frameState.camera.position) === 0.0
    );
  }

  _initializeLodMetric(header) {
    if ('lodMetricType' in header) {
      this.lodMetricType = header.lodMetricType;
    } else {
      this.lodMetricType = (this.parent && this.parent.lodMetricType) || this.tileset.lodMetricType;
      // eslint-disable-next-line
      console.warn(`3D Tile: Required prop lodMetricType is undefined. Using parent lodMetricType`);
    }

    // This is used to compute screen space error, i.e., the error measured in pixels.
    if ('lodMetricValue' in header) {
      this.lodMetricValue = header.lodMetricValue;
    } else {
      this.lodMetricValue =
        (this.parent && this.parent.lodMetricValue) || this.tileset.lodMetricValue;
      // eslint-disable-next-line
      console.warn(
        `3D Tile: Required prop lodMetricValue is undefined. Using parent lodMetricValue`
      );
    }
  }

  _initializeTransforms(tileHeader) {
    // The local transform of this tile.
    this.transform = tileHeader.transform ? new Matrix4(tileHeader.transform) : new Matrix4();

    const parent = this.parent;
    const tileset = this.tileset;

    const parentTransform =
      parent && parent.computedTransform
        ? parent.computedTransform.clone()
        : tileset.modelMatrix.clone();
    this.computedTransform = new Matrix4(parentTransform).multiplyRight(this.transform);

    const parentInitialTransform =
      parent && parent._initialTransform ? parent._initialTransform.clone() : new Matrix4();
    this._initialTransform = new Matrix4(parentInitialTransform).multiplyRight(this.transform);
  }

  _initializeBoundingVolumes(tileHeader) {
    this._contentBoundingVolume = null;
    this._viewerRequestVolume = null;

    this._updateBoundingVolume(tileHeader);
  }

  _initializeContent(tileHeader) {
    // Empty tile by default
    this.content = {_tileset: this.tileset, _tile: this};
    this.hasEmptyContent = true;
    this.contentState = TILE_CONTENT_STATE.UNLOADED;

    // When `true`, the tile's content points to an external tileset.
    // This is `false` until the tile's content is loaded.
    this.hasTilesetContent = false;

    if (tileHeader.contentUrl) {
      this.content = null;
      this.hasEmptyContent = false;
    }
  }

  // TODO - remove anything not related to basic visibility detection
  _initializeRenderingState(header) {
    this.depth = header.level;
    this._shouldRefine = false;

    // Members this are updated every frame for tree traversal and rendering optimizations:
    this._distanceToCamera = 0;
    this._centerZDepth = 0;
    this._screenSpaceError = 0;
    this._visibilityPlaneMask = CullingVolume.MASK_INDETERMINATE;
    this._visible = false;
    this._inRequestVolume = false;

    this._stackLength = 0;
    this._selectionDepth = 0;

    this._frameNumber = 0;
    this._touchedFrame = 0;
    this._visitedFrame = 0;
    this._selectedFrame = 0;
    this._requestedFrame = 0;

    this._priority = 0.0;
  }

  _getRefine(refine) {
    // Inherit from parent tile if omitted.
    return refine || (this.parent && this.parent.refine) || TILE_REFINEMENT.REPLACE;
  }

  _isTileset() {
    return this.contentUrl.indexOf('.json') !== -1;
  }

  _onContentLoaded() {
    // Vector and Geometry tile rendering do not support the skip LOD optimization.
    switch (this.content && this.content.type) {
      case 'vctr':
      case 'geom':
        this.tileset.traverser.disableSkipLevelOfDetail = true;
        break;
      default:
    }

    // The content may be tileset json
    if (this._isTileset()) {
      this.hasTilesetContent = true;
    }
  }

  _updateBoundingVolume(header) {
    // Update the bounding volumes
    this.boundingVolume = createBoundingVolume(
      header.boundingVolume,
      this.computedTransform,
      this.boundingVolume
    );

    const content = header.content;
    if (!content) {
      return;
    }

    // TODO Cesium specific
    // Non-leaf tiles may have a content bounding-volume, which is a tight-fit bounding volume
    // around only the features in the tile. This box is useful for culling for rendering,
    // but not for culling for traversing the tree since it does not guarantee spatial coherence, i.e.,
    // since it only bounds features in the tile, not the entire tile, children may be
    // outside of this box.
    if (content.boundingVolume) {
      this._contentBoundingVolume = createBoundingVolume(
        content.boundingVolume,
        this.computedTransform,
        this._contentBoundingVolume
      );
    }
    if (header.viewerRequestVolume) {
      this._viewerRequestVolume = createBoundingVolume(
        header.viewerRequestVolume,
        this.computedTransform,
        this._viewerRequestVolume
      );
    }
  }

  // Update the tile's transform. The transform is applied to the tile's bounding volumes.
  _updateTransform(parentTransform = new Matrix4()) {
    const computedTransform = parentTransform.clone().multiplyRight(this.transform);
    const didTransformChange = !computedTransform.equals(this.computedTransform);

    if (!didTransformChange) {
      return;
    }

    this.computedTransform = computedTransform;

    this._updateBoundingVolume(this.header);
  }

  // TODO Cesium specific
  // Update whether the tile has expired.
  updateExpiration() {
    if (defined(this._expireDate) && this.contentReady && !this.hasEmptyContent) {
      const now = Date.now();
      if (Date.lessThan(this._expireDate, now)) {
        this.contentState = TILE_CONTENT_STATE.EXPIRED;
        this._expiredContent = this.content;
      }
    }
  }

  get extras() {
    return this.header.extras;
  }
}
