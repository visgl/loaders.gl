// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md
import {Vector3, Matrix4} from '@math.gl/core';
import {CullingVolume, Intersect} from '@math.gl/culling';

import {parse, fetchFile, path} from '@loaders.gl/core';
import {TILE_REFINEMENT, TILE_CONTENT_STATE, createBoundingVolume} from '@loaders.gl/tiles';
import {assert} from '@loaders.gl/loader-utils';

import Tile3DLoader from '../../tile-3d-loader';
import Tileset3DLoader from '../../tileset-3d-loader';
import {TILE3D_OPTIMIZATION_HINT} from '../constants';

const defined = x => x !== undefined && x !== null;

const scratchVector = new Vector3();

// A Tile3DHeader represents a tile a Tileset3D. When a tile is first created, its content is not loaded;
// the content is loaded on-demand when needed based on the view.
// Do not construct this directly, instead access tiles through {@link Tileset3D#tileVisible}.
export default class Tile3DHeader {
  constructor(tileset, header, parentHeader, basePath) {
    // assert(tileset._asset);
    assert(typeof header === 'object');

    this._tileset = tileset;
    this._header = header;
    this._basePath = basePath;
    this._content = null;
    this._contentState = TILE_CONTENT_STATE.UNLOADED;
    this._gpuMemoryUsageInBytes = 0;

    // This tile's parent or `undefined` if this tile is the root.
    this.parent = parentHeader;
    // The tile's children.
    this.children = [];
    // Specifies the type of refine that is used when traversing this tile for rendering.
    this.refine = this._getRefine(header.refine);
    this.cacheNode = undefined;
    this.userData = {};

    // The error, in meters, introduced if this tile is rendered and its children are not.
    // This is used to compute screen space error, i.e., the error measured in pixels.
    if ('geometricError' in header) {
      this.geometricError = header.geometricError;
    } else {
      this.geometricError = (this.parent && this.parent.geometricError) || tileset.geometricError;
      // eslint-disable-next-line
      console.warn('3D Tile: Required prop geometricError is undefined. Using parent error');
    }

    this._initializeTransforms(header);
    this._initializeBoundingVolumes(header);
    this._initializeContent(header);
    this._initializeCache(header);

    // Marks whether the tile's children bounds are fully contained within the tile's bounds
    // @type {TILE3D_OPTIMIZATION_HINT}
    this._optimChildrenWithinParent = TILE3D_OPTIMIZATION_HINT.NOT_COMPUTED;

    this._initializeRenderingState();

    Object.seal(this);
  }

  destroy() {
    this._header = null;
  }

  isDestroyed() {
    return this._header === null;
  }

  // The tileset containing this tile.
  get gpuMemoryUsageInBytes() {
    return this._gpuMemoryUsageInBytes;
  }

  // The tileset containing this tile.
  get tileset() {
    return this._tileset;
  }

  // The depth of the tile in the tileset tree.
  get depth() {
    return this._depth;
  }

  // The most recent frame that the tile was selected
  get selectedFrame() {
    return this._selectedFrame;
  }

  get isVisibleAndInRequestVolume() {
    return this._visible && this._inRequestVolume;
  }

  // The tile's content.  This represents the actual tile's payload,
  // not the content's metadata in the tileset JSON file.
  get content() {
    return this._content;
  }

  // Determines if the tile's content is ready. This is automatically `true` for
  // tile's with empty content.
  get contentReady() {
    return this._contentState === TILE_CONTENT_STATE.READY;
  }

  // Returns true if tile is not an empty tile and not an external tileset
  get hasRenderContent() {
    return !this.hasEmptyContent && !this.hasTilesetContent;
  }

  // Determines if the tile has available content to render.  `true` if the tile's
  // content is ready or if it has expired content this renders while new content loads; otherwise,
  get contentAvailable() {
    return (
      (this.contentReady && this.hasRenderContent) ||
      (defined(this._expiredContent) && !this.contentFailed)
    );
  }

  // Returns true if tile has renderable content but it's unloaded
  get hasUnloadedContent() {
    return this.hasRenderContent && this.contentUnloaded;
  }

  // Determines if the tile's content has not be requested. `true` if tile's
  // content has not be requested; otherwise, `false`.
  get contentUnloaded() {
    return this._contentState === TILE_CONTENT_STATE.UNLOADED;
  }

  // Determines if the tile's content is expired. `true` if tile's
  // content is expired; otherwise, `false`.
  get contentExpired() {
    return this._contentState === TILE_CONTENT_STATE.EXPIRED;
  }

  // Determines if the tile's content failed to load.  `true` if the tile's
  // content failed to load; otherwise, `false`.
  get contentFailed() {
    return this._contentState === TILE_CONTENT_STATE.FAILED;
  }

  get url() {
    return this.tileset.getTileUrl(this.contentUri, this._basePath);
  }

  get uri() {
    return this.tileset.getTileUrl(this.contentUri, this._basePath);
  }

  // Get the tile's bounding volume.
  get boundingVolume() {
    return this._boundingVolume;
  }

  // Get the bounding volume of the tile's contents.  This defaults to the
  // tile's bounding volume when the content's bounding volume is `undefined`.
  get contentBoundingVolume() {
    return this._contentBoundingVolume || this._boundingVolume;
  }

  // Get the bounding sphere derived from the tile's bounding volume.
  get boundingSphere() {
    return this._boundingVolume.boundingSphere;
  }

  // Returns the `extras` property in the tileset JSON for this tile, which contains application specific metadata.
  // Returns `undefined` if `extras` does not exist.
  // @see {@link https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/specification#specifying-extensions-and-application-specific-extras|Extras in the 3D Tiles specification.}
  get extras() {
    return this._header.extras;
  }

  get hasChildren() {
    // this.children are Tile3DHeader objects with content fetched from server
    // this._header.children are children of this tile which are not yet fetched
    return this.children.length > 0 || (this._header.children && this.children.length > 0);
  }

  // Get the tile's screen space error.
  getScreenSpaceError(frameState, useParentGeometricError) {
    const tileset = this._tileset;
    const parentGeometricError =
      (this.parent && this.parent.geometricError) || tileset.geometricError;
    const geometricError = useParentGeometricError ? parentGeometricError : this.geometricError;

    // Leaf tiles do not have any error so save the computation
    if (geometricError === 0.0) {
      return 0.0;
    }

    // TODO: Orthographic Frustum needs special treatment?
    // this._getOrthograhicScreenSpaceError();

    // Avoid divide by zero when viewer is inside the tile
    const distance = Math.max(this._distanceToCamera, 1e-7);
    const {height, sseDenominator} = frameState;
    let error = (geometricError * height) / (distance * sseDenominator);

    error -= this._getDynamicScreenSpaceError(distance);

    return error;
  }

  // TODO: Refined screen space error that minimizes tiles in non-first-person
  _getDynamicScreenSpaceError(distance) {
    function fog(distanceToCamera, density) {
      const scalar = distanceToCamera * density;
      return 1.0 - Math.exp(-(scalar * scalar));
    }

    const tileset = this._tileset;

    if (tileset.dynamicScreenSpaceError && tileset._dynamicScreenSpaceErrorComputedDensity) {
      const density = tileset._dynamicScreenSpaceErrorComputedDensity;
      const factor = tileset.dynamicScreenSpaceErrorFactor;
      const dynamicError = fog(distance, density) * factor;
      return dynamicError;
    }

    return 0;
  }

  // Requests the tile's content.
  // The request may not be made if the Request Scheduler can't prioritize it.
  // eslint-disable-next-line max-statements
  async loadContent(frameState) {
    if (this.hasEmptyContent) {
      return false;
    }

    if (this._content) {
      return true;
    }

    const expired = this.contentExpired;

    // Append a query parameter of the tile expiration date to prevent caching
    // if (expired) {
    //   expired: this.expireDate.toString()
    // const request = new Request({
    //   throttle: true,
    //   throttleByServer: true,
    //   type: RequestType.TILES3D,
    //   priorityFunction: createPriorityFunction(this),
    //   serverKey: this._serverKey
    // });

    if (expired) {
      this.expireDate = undefined;
    }

    this._contentState = TILE_CONTENT_STATE.LOADING;

    function updatePriority(tile) {
      // Check if any reason to abort
      if (!tile._visible) {
        return -1;
      }
      if (tile._contentState === TILE_CONTENT_STATE.UNLOADED) {
        return -1;
      }
      return Math.max(1e7 - tile._priority, 0) || 0;
    }

    const cancelled = !(await this.tileset._requestScheduler.scheduleRequest(this, updatePriority));

    if (cancelled) {
      this._contentState = TILE_CONTENT_STATE.UNLOADED;
      return false;
    }

    try {
      const contentUri = this.uri;

      let response;
      try {
        this.tileset._requestScheduler.startRequest(this);
        response = await fetchFile(contentUri, this.tileset.options.fetchOptions);
      } finally {
        this.tileset._requestScheduler.endRequest(this);
      }

      // The content can be a binary tile ot a JSON tileset
      this._content = await parse(response, [Tile3DLoader, Tileset3DLoader]);
      // if (Tile3D.isTile(content)) {
      //   new Tileset3D(content, contentUri);

      if (contentUri.indexOf('.json') !== -1) {
        // Add tile headers for the nested tilset's subtree
        // Async update of the tree should be fine since there would never be edits to the same node
        // TODO - we need to capture the child tileset's URL
        this._tileset._initializeTileHeaders(this._content, this, path.dirname(this.uri));
      }

      this._contentState = TILE_CONTENT_STATE.READY;
      this._contentLoaded();
      return true;
    } catch (error) {
      // Tile is unloaded before the content finishes loading
      this._contentState = TILE_CONTENT_STATE.FAILED;
      throw error;
    }
  }

  // Unloads the tile's content.
  unloadContent() {
    if (!this.hasRenderContent) {
      return false;
    }
    if (this._content && this._content.destroy) {
      this._content.destroy();
    }
    this._content = null;
    this._contentState = TILE_CONTENT_STATE.UNLOADED;
    return true;
  }

  // _getOrthograhicScreenSpaceError() {
  // if (frustum instanceof OrthographicFrustum) {
  //   const pixelSize = Math.max(frustum.top - frustum.bottom, frustum.right - frustum.left) / Math.max(width, height);
  //   error = geometricError / pixelSize;
  // }

  // Update the tile's visibility.
  updateVisibility(frameState) {
    const tileset = this._tileset;
    if (this._frameNumber === tileset._frameNumber) {
      // Return early if visibility has already been checked during the traversal.
      // The visibility may have already been checked if the cullWithChildrenBounds optimization is used.
      return;
    }

    const parent = this.parent;
    const parentTransform = parent ? parent.computedTransform : this._tileset.modelMatrix;
    const parentVisibilityPlaneMask = parent
      ? parent._visibilityPlaneMask
      : CullingVolume.MASK_INDETERMINATE;
    this._updateTransform(parentTransform);
    this._distanceToCamera = this.distanceToTile(frameState);
    // this._centerZDepth = this.cameraSpaceZDepth(frameState);
    this._screenSpaceError = this.getScreenSpaceError(frameState, false);
    this._visibilityPlaneMask = this.visibility(frameState, parentVisibilityPlaneMask); // Use parent's plane mask to speed up visibility test
    this._visible = this._visibilityPlaneMask !== CullingVolume.MASK_OUTSIDE;
    this._inRequestVolume = this.insideViewerRequestVolume(frameState);

    this._frameNumber = tileset._frameNumber;
  }

  // Update whether the tile has expired.
  updateExpiration() {
    if (defined(this.expireDate) && this.contentReady && !this.hasEmptyContent) {
      const now = Date.now();
      if (Date.lessThan(this.expireDate, now)) {
        this._contentState = TILE_CONTENT_STATE.EXPIRED;
        this._expiredContent = this._content;
      }
    }
  }

  // Determines whether the tile's bounding volume intersects the culling volume.
  // @param {FrameState} frameState The frame state.
  // @param {Number} parentVisibilityPlaneMask The parent's plane mask to speed up the visibility check.
  // @returns {Number} A plane mask as described above in {@link CullingVolume#computeVisibilityWithPlaneMask}.
  visibility(frameState, parentVisibilityPlaneMask) {
    const {cullingVolume} = frameState;
    const {boundingVolume, tileset} = this;

    const {clippingPlanes, clippingPlanesOriginMatrix} = tileset;
    if (clippingPlanes && clippingPlanes.enabled) {
      const intersection = clippingPlanes.computeIntersectionWithBoundingVolume(
        boundingVolume,
        clippingPlanesOriginMatrix
      );
      this._isClipped = intersection !== Intersect.INSIDE;
      if (intersection === Intersect.OUTSIDE) {
        return CullingVolume.MASK_OUTSIDE;
      }
    }

    // return cullingVolume.computeVisibilityWithPlaneMask(boundingVolume, parentVisibilityPlaneMask);
    return cullingVolume.computeVisibilityWithPlaneMask(boundingVolume, parentVisibilityPlaneMask);
  }

  // Assuming the tile's bounding volume intersects the culling volume, determines
  // whether the tile's content's bounding volume intersects the culling volume.
  // @param {FrameState} frameState The frame state.
  // @returns {Intersect} The result of the intersection: the tile's content is completely outside, completely inside, or intersecting the culling volume.
  contentVisibility(frameState) {
    return true;
    /*
    // Assumes the tile's bounding volume intersects the culling volume already, so
    // just return Intersect.INSIDE if there is no content bounding volume.
    if (!defined(this._contentBoundingVolume)) {
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
    const boundingVolume = tile._contentBoundingVolume;

    const tileset = this._tileset;
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
    const boundingVolume = this._boundingVolume;
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
    return !viewerRequestVolume || viewerRequestVolume.distanceToCamera(frameState) === 0.0;
  }

  // PRIVATE

  _initializeCache(header) {
    // The node in the tileset's LRU cache, used to determine when to unload a tile's content.
    this.cacheNode = undefined;

    const expire = header.expire;
    let expireDuration;
    let expireDate;
    if (expire) {
      expireDuration = expire.duration;
      if (expire.date) {
        expireDate = Date.fromIso8601(expire.date);
      }
    }

    // The time in seconds after the tile's content is ready when the content expires and new content is requested.
    // @type {Number}
    this.expireDuration = expireDuration;

    // The date when the content expires and new content is requested.
    // @type {Date}
    this.expireDate = expireDate;
  }

  _initializeTransforms(tileHeader) {
    // The local transform of this tile.
    this.transform = tileHeader.transform ? new Matrix4(tileHeader.transform) : new Matrix4();

    const parent = this.parent;
    const tileset = this._tileset;

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
    this._boundingVolume = createBoundingVolume(tileHeader.boundingVolume, this.computedTransform);

    this._contentBoundingVolume = null;
    this._viewerRequestVolume = null;

    // Non-leaf tiles may have a content bounding-volume, which is a tight-fit bounding volume
    // around only the features in the tile. This box is useful for culling for rendering,
    // but not for culling for traversing the tree since it does not guarantee spatial coherence, i.e.,
    // since it only bounds features in the tile, not the entire tile, children may be
    // outside of this box.
    if (tileHeader.content && tileHeader.content.boundingVolume) {
      this._contentBoundingVolume = createBoundingVolume(
        tileHeader.boundingVolume,
        this.computedTransform
      );
    }

    if (tileHeader.viewerRequestVolume) {
      this._viewerRequestVolume = createBoundingVolume(
        tileHeader.viewerRequestVolume,
        this.computedTransform
      );
    }
  }

  _initializeContent(tileHeader) {
    // Empty tile by default
    this._content = {_tileset: this._tileset, _tile: this};
    this.hasEmptyContent = true;
    this.contentState = TILE_CONTENT_STATE.UNLOADED;
    this._expiredContent = undefined;
    this._serverKey = null;

    // When `true`, the tile's content points to an external tileset.
    // This is `false` until the tile's content is loaded.
    this.hasTilesetContent = false;

    // If a content tileHeader
    if (tileHeader.content) {
      this.contentUri = tileHeader.content.uri || tileHeader.content.url;
      if ('url' in tileHeader) {
        // eslint-disable-next-line
        console.warn('Tileset 3D: "content.url" property deprecated. Use "content.uri" instead.');
        this.contentUri = tileHeader.url;
      }
      this._content = null;
      this.hasEmptyContent = false;
      this.contentState = TILE_CONTENT_STATE.UNLOADED;
      this.fullUri = `${this._basePath}/${this.contentUri}`;
      this.id = this.fullUri;
    }
  }

  // TODO - remove anything not related to basic visibility detection
  _initializeRenderingState() {
    // Members this are updated every frame for tree traversal and rendering optimizations:
    this._distanceToCamera = 0;
    this._centerZDepth = 0;
    this._screenSpaceError = 0;
    this._visibilityPlaneMask = CullingVolume.MASK_INDETERMINATE;
    this._visible = false;
    this._inRequestVolume = false;

    this._finalResolution = true;
    this._depth = 0;
    this._stackLength = 0;
    this._selectionDepth = 0;

    this._frameNumber = 0;
    this._touchedFrame = 0;
    this._visitedFrame = 0;
    this._selectedFrame = 0;
    this._requestedFrame = 0;
    this._ancestorWithContent = undefined;
    this._ancestorWithContentAvailable = undefined;
    this._refines = false;
    this._shouldSelect = false;
    this._priority = 0.0;
  }

  _getRefine(refine) {
    switch (refine) {
      case 'REPLACE':
      case 'replace':
        return TILE_REFINEMENT.REPLACE;
      case 'ADD':
      case 'add':
        return TILE_REFINEMENT.ADD;
      default:
        // Inherit from parent tile if omitted.
        return this.parent ? this.parent.refine : TILE_REFINEMENT.REPLACE;
    }
  }

  _isTileset(content) {
    return Boolean(content.asset);
  }

  _contentLoaded() {
    // Vector and Geometry tile rendering do not support the skip LOD optimization.
    switch (this._content && this._content.type) {
      case 'vctr':
      case 'geom':
        this.tileset.traverser.disableSkipLevelOfDetail = true;
        break;
      default:
    }

    // The content may be tileset json
    if (this._isTileset(this._content)) {
      this.hasTilesetContent = true;
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

    // Matrix4.clone(computedTransform, this.computedTransform);

    // Update the bounding volumes
    const header = this._header;

    const content = this._header.content;
    this._boundingVolume = createBoundingVolume(
      header.boundingVolume,
      this.computedTransform,
      this._boundingVolume
    );
    if (this._contentBoundingVolume) {
      this._contentBoundingVolume = createBoundingVolume(
        content.boundingVolume,
        this.computedTransform,
        this._contentBoundingVolume
      );
    }
    if (this._viewerRequestVolume) {
      this._viewerRequestVolume = createBoundingVolume(
        header.viewerRequestVolume,
        this.computedTransform,
        this._viewerRequestVolume
      );
    }
  }
}

/*
function updateContent(tile, tileset, frameState) {
  const content = tile._content;
  const expiredContent = tile._expiredContent;

  if (expiredContent) {
    if (!tile.contentReady) {
      // Render the expired content while the content loads
      expiredContent.update(tileset, frameState);
      return;
    }

    // New content is ready, destroy expired content
    tile._expiredContent.destroy();
    tile._expiredContent = undefined;
  }

  content.update(tileset, frameState);
}

function updateExpireDate(tile) {
  if (defined(tile.expireDuration)) {
    const expireDurationDate = Date.now(scratchDate);
    Date.addSeconds(expireDurationDate, tile.expireDuration, expireDurationDate);

    if (defined(tile.expireDate)) {
      if (Date.lessThan(tile.expireDate, expireDurationDate)) {
        Date.clone(expireDurationDate, tile.expireDate);
      }
    } else {
      tile.expireDate = Date.clone(expireDurationDate);
    }
  }
}

function createPriorityFunction(tile) {
  return function() {
    return tile._priority;
  };
}
*/
