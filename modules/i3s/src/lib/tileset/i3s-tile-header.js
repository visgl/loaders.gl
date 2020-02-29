/* global fetch */
import {Vector3, Matrix4} from '@math.gl/core';
import {CullingVolume, Intersect, Plane} from '@math.gl/culling';
import {Ellipsoid} from '@math.gl/geospatial';

import {assert} from '@loaders.gl/loader-utils';
import {TILE_REFINEMENT, TILE_CONTENT_STATE, createBoundingVolume} from '@loaders.gl/tiles';

import {getScreenSize} from '../utils/lod';
import {parseI3SNodeGeometry} from '../parsers/parse-i3s-node-geometry';

const scratchCenter = new Vector3();
const scratchToTileCenter = new Vector3();
const scratchPlane = new Plane();

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

function computeVisibilityWithPlaneMask(cullingVolume, boundingVolume, parentPlaneMask) {
  // Support array of planes
  if (Array.isArray(cullingVolume)) {
    const planes = cullingVolume;
    return new CullingVolume(planes);
  }

  assert(boundingVolume, 'boundingVolume is required.');
  assert(Number.isFinite(parentPlaneMask), 'parentPlaneMask is required.');

  if (
    parentPlaneMask === CullingVolume.MASK_OUTSIDE ||
    parentPlaneMask === CullingVolume.MASK_INSIDE
  ) {
    // parent is completely outside or completely inside, so this child is as well.
    return parentPlaneMask;
  }

  // Start with MASK_INSIDE (all zeros) so that after the loop, the return value can be compared with MASK_INSIDE.
  // (Because if there are fewer than 31 planes, the upper bits wont be changed.)
  let mask = CullingVolume.MASK_INSIDE;

  const planes = cullingVolume.planes;
  for (let k = 0; k < cullingVolume.planes.length; ++k) {
    // For k greater than 31 (since 31 is the maximum number of INSIDE/INTERSECTING bits we can store), skip the optimization.
    const flag = k < 31 ? 1 << k : 0;
    if (k < 31 && (parentPlaneMask & flag) === 0) {
      // boundingVolume is known to be INSIDE this plane.
      // eslint-disable-next-line no-continue
      continue;
    }

    const plane = scratchPlane.fromNormalDistance(planes[k].normal, planes[k].distance);
    const result = boundingVolume.intersectPlane(plane);

    if (result === Intersect.OUTSIDE) {
      return CullingVolume.MASK_OUTSIDE;
    } else if (result === Intersect.INTERSECTING) {
      mask |= flag;
    }
  }

  return mask;
}

// A Tile3DHeader represents a tile as Tileset3D. When a tile is first created, its content is not loaded;
// the content is loaded on-demand when needed based on the view.
// Do not construct this directly, instead access tiles through {@link Tileset3D#tileVisible}.
export default class I3STileHeader {
  constructor(tileset, header, parentHeader, basePath) {
    // assert(tileset._asset);
    assert(typeof header === 'object');

    this.id = header.id;
    this.lodMaxError = header.lodSelection[0].maxError;

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
    this._initializeTransforms(header);
    this._initializeBoundingVolumes(header);
    this._initializeContent(header);
    this._initializeCache(header);

    this._initializeRenderingState(header);

    // for debugging
    this._loadJudge = null;

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

  get hasChildren() {
    return this.children.length > 0 || (this._header.children && this._header.children.length > 0);
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
    return `${this._basePath}/nodes/${this.id}`;
  }

  // Get the tile's bounding volume.
  get boundingVolume() {
    return this._boundingVolume;
  }

  // Get the bounding sphere derived from the tile's bounding volume.
  get boundingSphere() {
    return this._boundingVolume.boundingSphere;
  }

  // Get the tile's screen space error.
  getScreenSpaceError(frameState) {
    return getScreenSize(this, frameState);
  }

  // Requests the tile's content.
  // The request may not be made if the Request Scheduler can't prioritize it.
  // eslint-disable-next-line max-statements
  async loadContent() {
    if (!this.tileset._debug[this.id]) {
      this.tileset._debug[this.id] = {
        load: 0,
        featureLoad: 0,
        geometryLoad: 0,
        unload: 0
      };
    }
    if (this.hasEmptyContent) {
      return false;
    }

    if (this._content) {
      return true;
    }

    const expired = this.contentExpired;

    if (expired) {
      this.expireDate = undefined;
    }

    this._contentState = TILE_CONTENT_STATE.LOADING;

    const cancelled = !(await this.tileset._requestScheduler.scheduleRequest(this, updatePriority));

    if (cancelled) {
      this._contentState = TILE_CONTENT_STATE.UNLOADED;
      this.tileset._debug[this.id].unload++;
      return false;
    }

    try {
      this.tileset._requestScheduler.startRequest(this);
      await this._loadData();
      this.tileset._requestScheduler.endRequest(this);
      this._contentState = TILE_CONTENT_STATE.READY;
      return true;
    } catch (error) {
      // Tile is unloaded before the content finishes loading
      this._contentState = TILE_CONTENT_STATE.FAILED;
      throw error;
    }
  }

  async _loadFeatureData() {
    const featureData = this._header.featureData[0];
    const featureDataPath = `${this._basePath}/nodes/${this.id}/${featureData.href}`;
    this.tileset._debug[this.id].featureLoad++;
    const response = await fetch(featureDataPath);
    return await response.json();
  }

  async _loadGeometryBuffer() {
    const geometryData = this._header.geometryData[0];
    const geometryDataPath = `${this._basePath}/nodes/${this.id}/${geometryData.href}`;
    this.tileset._debug[this.id].geometryLoad++;
    return await fetch(geometryDataPath).then(resp => resp.arrayBuffer());
  }

  async _loadData() {
    if (!(this._content && this._content.featureData)) {
      this._content = this._content || {};
      this._content.featureData = {};

      const featureData = await this._loadFeatureData();
      const geometryBuffer = await this._loadGeometryBuffer();

      this._content.featureData = featureData;

      if (this._header.textureData) {
        this._content.texture = `${this._basePath}/nodes/${this.id}/${
          this._header.textureData[0].href
        }`;
      }

      parseI3SNodeGeometry(geometryBuffer, this);
      this.tileset._debug[this.id].load++;
    }
  }

  // Unloads the tile's content.
  unloadContent() {
    if (!this.tileset._debug[this.id]) {
      this.tileset._debug[this.id] = {
        load: 0,
        featureLoad: 0,
        geometryLoad: 0,
        unload: 0
      };
    }
    if (!this.hasRenderContent) {
      return false;
    }
    if (this._content && this._content.destroy) {
      this._content.destroy();
    }
    this._content = null;
    this._contentState = TILE_CONTENT_STATE.UNLOADED;
    this.tileset._debug[this.id].unload++;
    return true;
  }

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
    this._screenSpaceError = this.getScreenSpaceError(frameState, false);
    this._visibilityPlaneMask = this.visibility(frameState, parentVisibilityPlaneMask); // Use parent's plane mask to speed up visibility test
    this._priority = this.lodMaxError;
    this._visible = this._visibilityPlaneMask !== CullingVolume.MASK_OUTSIDE;
    this._inRequestVolume = this.insideViewerRequestVolume(frameState);

    this._frameNumber = tileset._frameNumber;
  }

  // Update whether the tile has expired.
  // TODO
  updateExpiration() {}

  // Determines whether the tile's bounding volume intersects the culling volume.
  // @param {FrameState} frameState The frame state.
  // @param {Number} parentVisibilityPlaneMask The parent's plane mask to speed up the visibility check.
  // @returns {Number} A plane mask as described above in {@link CullingVolume#computeVisibilityWithPlaneMask}.
  visibility(frameState, parentVisibilityPlaneMask) {
    const {cullingVolume} = frameState;
    const {boundingVolume} = this;

    return computeVisibilityWithPlaneMask(cullingVolume, boundingVolume, parentVisibilityPlaneMask);
  }

  // Assuming the tile's bounding volume intersects the culling volume, determines
  // whether the tile's content's bounding volume intersects the culling volume.
  // @param {FrameState} frameState The frame state.
  // @returns {Intersect} The result of the intersection: the tile's content is completely outside, completely inside, or intersecting the culling volume.
  contentVisibility(frameState) {
    return true;
  }

  // Computes the (potentially approximate) distance from the closest point of the tile's bounding volume to the camera.
  // @param {FrameState} frameState The frame state.
  // @returns {Number} The distance, in meters, or zero if the camera is inside the bounding volume.
  distanceToTile(frameState) {
    const boundingVolume = this._boundingVolume;
    return Math.sqrt(Math.max(boundingVolume.distanceSquaredTo(frameState.camera.position), 1e-7));
  }

  // Computes the tile's camera-space z-depth.
  // @param {FrameState} frameState The frame state.
  // @returns {Number} The distance, in meters.
  cameraSpaceZDepth({camera}) {
    const boundingVolume = this.boundingVolume; // Gets the underlying OrientedBoundingBox or BoundingSphere
    scratchToTileCenter.subVectors(boundingVolume.center, camera.position);
    return camera.direction.dot(scratchToTileCenter);
  }

  /**
   * Checks if the camera is inside the viewer request volume.
   * @param {FrameState} frameState The frame state.
   * @returns {Boolean} Whether the camera is inside the volume.
   */
  insideViewerRequestVolume(frameState) {
    return true;
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
    scratchCenter.copy(tileHeader.mbs);
    const centerCartesian = Ellipsoid.WGS84.cartographicToCartesian(tileHeader.mbs.slice(0, 3));
    const boundingVolume = {
      sphere: [...centerCartesian, tileHeader.mbs[3]]
    };

    this._mbs = tileHeader.mbs;
    this._boundingVolume = createBoundingVolume(boundingVolume, this.computedTransform);
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

    if (tileHeader.featureData && tileHeader.geometryData) {
      this.contentUri = tileHeader.geometryData[0].href;
      this._content = null;
      this.hasEmptyContent = false;
      this.contentState = TILE_CONTENT_STATE.UNLOADED;
      this.fullUri = `${this._basePath}/${this.id}/${this.contentUri}`;
    }
  }

  // TODO - remove anything not related to basic visibility detection
  _initializeRenderingState(header) {
    // Members this are updated every frame for tree traversal and rendering optimizations:
    this._distanceToCamera = 0;
    this._centerZDepth = 0;
    this._screenSpaceError = 0;
    this._visibilityPlaneMask = CullingVolume.MASK_INDETERMINATE;
    this._visible = false;
    this._inRequestVolume = false;

    this._depth = header.level;
    this._stackLength = 0;
    this._selectionDepth = 0;

    this._frameNumber = 0;
    this._touchedFrame = 0;
    this._visitedFrame = 0;
    this._selectedFrame = 0;
    this._requestedFrame = 0;

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

  // Update the tile's transform. The transform is applied to the tile's bounding volumes.
  _updateTransform(parentTransform = new Matrix4()) {
    const computedTransform = parentTransform.clone().multiplyRight(this.transform);
    const didTransformChange = !computedTransform.equals(this.computedTransform);

    if (!didTransformChange) {
      return;
    }

    this.computedTransform = computedTransform;

    // Update the bounding volumes
    const header = this._header;

    this._boundingVolume = createBoundingVolume(
      header.boundingVolume,
      this.computedTransform,
      this._boundingVolume
    );
  }
}
