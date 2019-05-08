"use strict";module.export({default:()=>Tile3DHeader});var Vector3,Matrix4;module.link('math.gl',{Vector3(v){Vector3=v},Matrix4(v){Matrix4=v}},0);var TILE_3D_REFINEMENT;module.link('../constants',{TILE_3D_REFINEMENT(v){TILE_3D_REFINEMENT=v}},1);// import {TILE3D_REFINEMENT, TILE3D_OPTIMIZATION_HINT} from '../constants';



/* eslint-disable */
const scratchDate = new Date();
const scratchCommandList = [];
const scratchToTileCenter = new Vector3();

// A Tile3DHeader represents a tile a Tileset3D. When a tile is first created, its content is not loaded;
// the content is loaded on-demand when needed based on the view.
// Do not construct this directly, instead access tiles through {@link Tileset3D#tileVisible}.
class Tile3DHeader {
  constructor(header, parentHeader, tileset, baseResource) {
    this._initialize(tileset, parentheader, tileset, baseResource);
  }

  destroy() {}

  // The tileset containing this tile.
  get tileset() {
    return this._tileset;
  }

  // The tile's content.  This represents the actual tile's payload,
  // not the content's metadata in the tileset JSON file.
  get content() {
    return this._content;
  }

  // Get the tile's bounding volume.
  get boundingVolume() {
    return this._boundingVolume;
  }

  // Get the bounding volume of the tile's contents.  This defaults to the
  // tile's bounding volume when the content's bounding volume is <code>undefined</code>.
  get contentBoundingVolume() {
    return this._contentBoundingVolume || this._boundingVolume;
  }

  // Get the bounding sphere derived from the tile's bounding volume.
  get boundingSphere() {
    return this._boundingVolume.boundingSphere;
  }

  // Returns the <code>extras</code> property in the tileset JSON for this tile, which contains application specific metadata.
  // Returns <code>undefined</code> if <code>extras</code> does not exist.
  // @see {@link https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/specification#specifying-extensions-and-application-specific-extras|Extras in the 3D Tiles specification.}
  get extras() {
    return this._header.extras;
  }

  // Determines if the tile has available content to render.  <code>true</code> if the tile's
  // content is ready or if it has expired content this renders while new content loads; otherwise,
  get contentAvailable() {
    return (
      (this.contentReady && !this.hasEmptyContent && !this.hasTilesetContent) ||
      (defined(this._expiredContent) && !this.contentFailed)
    );
  }

  // Determines if the tile's content is ready. This is automatically <code>true</code> for
  // tile's with empty content.
  get contentReady() {
    return this._contentState === TILE3D_CONTENT_STATE.READY;
  }

  // Determines if the tile's content has not be requested. <code>true</code> if tile's
  // content has not be requested; otherwise, <code>false</code>.
  get contentUnloaded() {
    return this._contentState === TILE3D_CONTENT_STATE.UNLOADED;
  }

  // Determines if the tile's content is expired. <code>true</code> if tile's
  // content is expired; otherwise, <code>false</code>.
  get contentExpired() {
    return this._contentState === TILE3D_CONTENT_STATE.EXPIRED;
  }

  // Determines if the tile's content failed to load.  <code>true</code> if the tile's
  // content failed to load; otherwise, <code>false</code>.
  get contentFailed() {
    return this._contentState === TILE3D_CONTENT_STATE.FAILED;
  }

  // Get the tile's screen space error.
  getScreenSpaceError({frustum, width, height}, useParentGeometricError) {
    const tileset = this._tileset;
    const parentGeometricError = this.parent ? this.parent.geometricError : tileset._geometricError;
    const geometricError = useParentGeometricError ? parentGeometricError : this.geometricError;

    // Leaf tiles do not have any error so save the computation
    if (geometricError === 0.0) {
      return 0.0;
    }

    // TODO: Orthographic Frustum needs special treatment?
    // this._getOrthograhicScreenSpaceError();

    // Avoid divide by zero when viewer is inside the tile
    const distance = Math.max(this._distanceToCamera, 1e-7);
    const sseDenominator = frustum.sseDenominator;
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

  // _getOrthograhicScreenSpaceError() {
  // if (frustum instanceof OrthographicFrustum) {
  //   const pixelSize = Math.max(frustum.top - frustum.bottom, frustum.right - frustum.left) / Math.max(width, height);
  //   error = geometricError / pixelSize;
  // }

  // Update the tile's visibility.
  updateVisibility(frameState) {
    const parent = this.parent;
    const parentTransform = defined(parent) ? parent.computedTransform : this._tileset.modelMatrix;
    // const parentVisibilityPlaneMask = defined(parent)
    //   ? parent._visibilityPlaneMask
    //   : CullingVolume.MASK_INDETERMINATE;
    this._updateTransform(parentTransform);
    this._distanceToCamera = this.distanceToTile(frameState);
    this._centerZDepth = this.distanceToTileCenter(frameState);
    this._screenSpaceError = this.getScreenSpaceError(frameState, false);
    this._visibilityPlaneMask = this.visibility(frameState, parentVisibilityPlaneMask); // Use parent's plane mask to speed up visibility test
    this._visible = this._visibilityPlaneMask !== CullingVolume.MASK_OUTSIDE;
    this._inRequestVolume = this.insideViewerRequestVolume(frameState);
  }

  // Update whether the tile has expired.
  updateExpiration() {
    if (defined(this.expireDate) && this.contentReady && !this.hasEmptyContent) {
      const now = Date.now(scratchDate);
      if (Date.lessThan(this.expireDate, now)) {
        this._contentState = TILE3D_CONTENT_STATE.EXPIRED;
        this._expiredContent = this._content;
      }
    }
  }

  // Requests the tile's content.
  // The request may not be made if the Request Scheduler can't prioritize it.
  async requestContent() {
    if (this.hasEmptyContent) {
      return false;
    }

    const tileset = this._tileset;

    requestTile;
    resource.request = request;

    // Append a query parameter of the tile expiration date to prevent caching
    // const expired = this.contentExpired;
    // if (expired) {
    //   expired: this.expireDate.toString()
    // const request = new Request({
    //   throttle: true,
    //   throttleByServer: true,
    //   type: RequestType.TILES3D,
    //   priorityFunction: createPriorityFunction(this),
    //   serverKey: this._serverKey
    // });

    this._contentState = TILE3D_CONTENT_STATE.LOADING;

    if (expired) {
      this.expireDate = undefined;
    }

    const response = await fetch(url);

    // The content can be a binary tile ot a  JSON/
    let content;
    try {
      content = parse(arrayBuffer, [Tile3DLoader, Tileset3DLoader]);
    } catch (error) {
      // Tile is unloaded before the content finishes loading
      this._contentState = TILE3D_CONTENT_STATE.FAILED;
      return;
    }

    // Tile is unloaded before the content finishes processing
    // return content.readyPromise.then(function(content) {
    //   if (this.isDestroyed()) {
    //     contentFailedFunction();
    //     return;
    //   }
    //   updateExpireDate(this);
    //   this._contentState = TILE3D_CONTENT_STATE.READY;
    // });

    this._contentState = TILE3D_CONTENT_STATE.READY;

    this._contentLoaded(content);
  }

  // Unloads the tile's content.
  unloadContent() {
    if (this.hasEmptyContent || this.hasTilesetContent) {
      return;
    }

    this._content = this._content && this._content.destroy && this._content.destroy();
    this._contentState = TILE3D_CONTENT_STATE.UNLOADED;
  }

  // Determines whether the tile's bounding volume intersects the culling volume.
  // @param {FrameState} frameState The frame state.
  // @param {Number} parentVisibilityPlaneMask The parent's plane mask to speed up the visibility check.
  // @returns {Number} A plane mask as described above in {@link CullingVolume#computeVisibilityWithPlaneMask}.
  visibility(frameState, parentVisibilityPlaneMask) {
    // TODO - implement culling
    return true;
    /*
    const cullingVolume = frameState.cullingVolume;
    const boundingVolume = this._boundingVolume;

    const tileset = this._tileset;
    const clippingPlanes = tileset.clippingPlanes;
    if (defined(clippingPlanes) && clippingPlanes.enabled) {
      const intersection = clippingPlanes.computeIntersectionWithBoundingVolume(
        boundingVolume,
        tileset.clippingPlanesOriginMatrix
      );
      this._isClipped = intersection !== Intersect.INSIDE;
      if (intersection === Intersect.OUTSIDE) {
        return CullingVolume.MASK_OUTSIDE;
      }
    }

    return cullingVolume.computeVisibilityWithPlaneMask(boundingVolume, parentVisibilityPlaneMask);
    */
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
  distanceToTile({frameState}) {
    const boundingVolume = this._boundingVolume;
    return boundingVolume.distanceToCamera(frameState);
  }

  // Computes the distance from the center of the tile's bounding volume to the camera.
  // @param {FrameState} frameState The frame state.
  // @returns {Number} The distance, in meters.
  distanceToTileCenter({camera}) {
    const tileBoundingVolume = this._boundingVolume;
    const boundingVolume = tileBoundingVolume.boundingVolume; // Gets the underlying OrientedBoundingBox or BoundingSphere
    const toCenter = Vector3.subtract(
      boundingVolume.center,
      camera.positionWC,
      scratchToTileCenter
    );
    const distance = Vector3.magnitude(toCenter);
    Vector3.divideByScalar(toCenter, distance, toCenter);
    const dot = Vector3.dot(camera.directionWC, toCenter);
    return distance * dot;
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

  _initialize(tileset, header, parentTile, baseResource) {
    assert(tileset._asset);
    assert(typeof header === 'object');

    this._tileset = tileset;
    this._header = header;

    // Gets the tile's children.
    this.children = [];
    // This tile's parent or <code>undefined</code> if this tile is the root.
    this.parent = parent;

    // Specifies the type of refine that is used when traversing this tile for rendering.
    this.refine = this._getRefine(header.refine);

    // The error, in meters, introduced if this tile is rendered and its children are not.
    // This is used to compute screen space error, i.e., the error measured in pixels.
    if ('geometricError' in header) {
      this.geometricError = header.geometricError;
    } else {
      this.geometricError = this.parent ? this.parent.geometricError : tileset._geometricError;
      console.warn('3D Tile: Required prop geometricError is undefined. Using parent error');
    }

    this._initializeTransforms(header);

    this._initializeBoundingVolumes(header);

    this._initializeContent(contentheader);

    // The node in the tileset's LRU cache, used to determine when to unload a tile's content.
    this.cacheNode = undefined;

    let expire = header.expire;
    let expireDuration;
    let expireDate;
    if (defined(expire)) {
      expireDuration = expire.duration;
      if (defined(expire.date)) {
        expireDate = Date.fromIso8601(expire.date);
      }
    }

    // The time in seconds after the tile's content is ready when the content expires and new content is requested.
    // @type {Number}
    this.expireDuration = expireDuration;

    // The date when the content expires and new content is requested.
    // @type {Date}
    this.expireDate = expireDate;

    // Marks whether the tile's children bounds are fully contained within the tile's bounds
    // @type {TILE_3D_OPTIMIZATION_HINT}
    this._optimChildrenWithinParent = TILE_3D_OPTIMIZATION_HINT.NOT_COMPUTED;

    this._initializeRenderingState();

    Object.seal(this);
  }

  _initializeTransforms(tileHeader) {
    // The local transform of this tile.
    this.transform = tileHeader.transform ? new Matrix4(tileHeader.transform) : new Matrix4();

    const parent = this.parent;
    const tileset = this._tileset;

    const parentTransform = parent ? parent.computedTransform.clone() : tileset.modelMatrix.clone();
    this.computedTransform = parentTransform.multiplyRight(this.transform);

    const parentInitialTransform = parent ? parent._initialTransform.clone() : new Matrix4();
    this._initialTransform = Matrix4.multiplyRight(parentInitialTransform, this.transform);

    this.computedTransform = computedTransform;
  }

  _initializeBoundingVolumes(tileHeader) {
    this._boundingVolume = this.createBoundingVolume(
      tileHeader.boundingVolume,
      this.computedTransform
    );

    this._contentBoundingVolume = null;
    this._viewerRequestVolume = null;

    // Non-leaf tiles may have a content bounding-volume, which is a tight-fit bounding volume
    // around only the features in the tile.  This box is useful for culling for rendering,
    // but not for culling for traversing the tree since it does not guarantee spatial coherence, i.e.,
    // since it only bounds features in the tile, not the entire tile, children may be
    // outside of this box.
    if (tileHeader.content && tileHeader.content.boundingVolume) {
      this._contentBoundingVolume = this.createBoundingVolume(
        tileHeader.boundingVolume,
        this.computedTransform
      );
    }

    if (tileHeader.viewerRequestVolume) {
      this._viewerRequestVolume = this.createBoundingVolume(
        tileHeader.viewerRequestVolume,
        this.computedTransform
      );
    }
  }

  _initializeContent(tileHeader) {
    // Empty tile by default
    this._content = {_tileset: tileset, _tile: this};
    this.hasEmptyContent = true;
    this.contentState = TILE3D_CONTENT_STATE.READY;
    this._expiredContent = undefined;
    this._serverKey = null;

    // When <code>true</code>, the tile's content points to an external tileset.
    // This is <code>false</code> until the tile's content is loaded.
    this.hasTilesetContent = false;

    // If a content tileHeader
    if (tileHeader) {
      this.contentUri = tileHeader.uri;
      if ('url' in tileHeader) {
        console.warn('Tileset 3D: "content.url" property deprecated. Use "content.uri" instead.');
        this.contentUri = tileHeader.url;
      }
      this._content = null;
      this.hasEmptyContent = false;
      this.contentState = TILE3D_CONTENT_STATE.UNLOADED;
      // this.serverKey = RequestScheduler.getServerKey(contentResource.getUrlComponent());
    }
  }

  // TODO - remove anything not related to basic visibility detection
  _initializeRenderingState() {
    // Members this are updated every frame for tree traversal and rendering optimizations:
    this._distanceToCamera = 0;
    this._centerZDepth = 0;
    this._screenSpaceError = 0;
    this._visibilityPlaneMask = 0;
    this._visible = false;
    this._inRequestVolume = false;

    this._finalResolution = true;
    this._depth = 0;
    this._stackLength = 0;
    this._selectionDepth = 0;

    this._updatedVisibilityFrame = 0;
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
        return TILE_3D_REFINEMENT.REPLACE;
      case 'ADD':
      case 'add':
        return TILE_3D_REFINEMENT.ADD;
      default:
        // Inherit from parent tile if omitted.
        return this.parent ? this.parent.refine : TILE_3D_REFINEMENT.REPLACE;
    }
  }

  _isTileset(content) {
    return 'tilesetVersion' in content;
  }

  _contentLoaded(content) {
    // Vector and Geometry tile rendering do not support the skip LOD optimization.
    switch (content.type) {
      case 'vctr':
      case 'geom':
        tileset._disableSkipLevelOfDetail = true;
      default:
    }

    this._content = content;

    // The content may be tileset json
    if (this._isTileset(content)) {
      this.hasTilesetContent = true;
    }
  }

  // Update the tile's transform. The transform is applied to the tile's bounding volumes.
  _updateTransform(parentTransform = new Matrix4()) {
    const computedTransform = parentTransform.clone().multiply(this.transform);
    const didTransformChange = !computedTransform.equals(this.computedTransform);

    if (!didTransformChange) {
      return;
    }

    // Matrix4.clone(computedTransform, this.computedTransform);

    // Update the bounding volumes
    const header = this._header;

    const content = this._header.content;
    this._boundingVolume = this.createBoundingVolume(
      header.boundingVolume,
      this.computedTransform,
      this._boundingVolume
    );
    if (this._contentBoundingVolume) {
      this._contentBoundingVolume = this.createBoundingVolume(
        content.boundingVolume,
        this.computedTransform,
        this._contentBoundingVolume
      );
    }
    if (this._viewerRequestVolume) {
      this._viewerRequestVolume = this.createBoundingVolume(
        header.viewerRequestVolume,
        this.computedTransform,
        this._viewerRequestVolume
      );
    }
  }
}

function updateContent(tile, tileset, frameState) {
  const content = tile._content;
  const expiredContent = tile._expiredContent;

  if (defined(expiredContent)) {
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
