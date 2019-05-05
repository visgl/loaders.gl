# Tile3D

A tile in a {@link Tileset3D}.

Notes:

- When a tile is first created, its content is not loaded; the content is loaded on-demand when needed based on the view.

/**
The tileset containing this tile.
_
@memberof Tile3D.prototype
_
@type {Tileset3D}
@readonly
\*/
get tileset() {
\
 /**
The tile's content. This represents the actual tile's payload,
not the content's metadata in the tileset JSON file.
_
@memberof Tile3D.prototype
_
@type {Tile3DContent}
@readonly
\*/
get content() {
return this.\_content;
}

/\*_
Get the tile's bounding volume.
_
@memberof Tile3D.prototype
_
@type {TileBoundingVolume}
@readonly
@private
_/
get boundingVolume() {
return this.\_boundingVolume;
}

/\*_
Get the bounding volume of the tile's contents. This defaults to the
tile's bounding volume when the content's bounding volume is
<code>undefined</code>.
_
@memberof Tile3D.prototype
_
@type {TileBoundingVolume}
@readonly
@private
_/
get contentBoundingVolume() {
return this.\_contentBoundingVolume || this.\_boundingVolume;
}

/\*_
Get the bounding sphere derived from the tile's bounding volume.
_
@memberof Tile3D.prototype
_
@type {BoundingSphere}
@readonly
_/
get boundingSphere() {
return this.\_boundingVolume.boundingSphere;
}

/\*_
Returns the <code>extras</code> property in the tileset JSON for this tile, which contains application specific metadata.
Returns <code>undefined</code> if <code>extras</code> does not exist.
_
@memberof Tile3D.prototype
_
@type {_}
@readonly
@see {@link https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/specification#specifying-extensions-and-application-specific-extras|Extras in the 3D Tiles specification.}
\*/
get extras() {
return this.\_header.extras;
}

/\*_
Gets or sets the tile's highlight color.
_
@memberof Tile3D.prototype
_
@type {Color}
_
@default {@link Color.WHITE}
_
@private
_/
get color() {
if (!defined(this.\_color)) {
this.\_color = new Color();
}
return Color.clone(this.\_color);
}

set color(value) {
this.\_color = Color.clone(value, this.\_color);
this.\_colorDirty = true;
}

/\*_
Determines if the tile has available content to render. <code>true</code> if the tile's
content is ready or if it has expired content that renders while new content loads; otherwise,
<code>false</code>.
_
@memberof Tile3D.prototype
_
@type {Boolean}
@readonly
_
@private
\*/
get contentAvailable() {
return (this.contentReady && !this.hasEmptyContent && !this.hasTilesetContent) || (defined(this.\_expiredContent) && !this.contentFailed);
}

/\*_
Determines if the tile's content is ready. This is automatically <code>true</code> for
tile's with empty content.
_
@memberof Tile3D.prototype
_
@type {Boolean}
@readonly
_
@private
\*/
get contentReady() {
return this.\_contentState === Tile3DContentState.READY;
}

/\*_
Determines if the tile's content has not be requested. <code>true</code> if tile's
content has not be requested; otherwise, <code>false</code>.
_
@memberof Tile3D.prototype
_
@type {Boolean}
@readonly
_
@private
\*/
get contentUnloaded() {
return this.\_contentState === Tile3DContentState.UNLOADED;
}

/\*_
Determines if the tile's content is expired. <code>true</code> if tile's
content is expired; otherwise, <code>false</code>.
_
@memberof Tile3D.prototype
_
@type {Boolean}
@readonly
_
@private
\*/
get contentExpired() {
return this.\_contentState === Tile3DContentState.EXPIRED;
}

/\*_
Determines if the tile's content failed to load. <code>true</code> if the tile's
content failed to load; otherwise, <code>false</code>.
_
@memberof Tile3D.prototype
_
@type {Boolean}
@readonly
_
@private
\*/
get contentFailed() {
return this.\_contentState === Tile3DContentState.FAILED;
}

### contentReadyToProcessPromise() {

/\*\*
Gets the promise that will be resolved when the tile's content is ready to process.
This happens after the content is downloaded but before the content is ready
to render.

<p>
The promise remains <code>undefined</code> until the tile's content is requested.
</p>
   *
@type {Promise.<Tile3DContent>}
@readonly
   *
@private
   */

### contentReadyPromise Promise.<Tile3DContent>

Gets the promise that will be resolved when the tile's content is ready to render.

<p>
The promise remains <code>undefined</code> until the tile's content is requested.
</p>

### commandsLength : Number

Estimates the number of draw commands used by this tile.

## Methods

### constructor(tileset, baseResource, header, parent)

Note: Do not construct this directly, instead access tiles through {@link Tileset3D#tileVisible}.

### destroy()

Releases resources managed by this tile.

### getScreenSpaceError(frameState, useParentGeometricError) {

Get the tile's screen space error.

    const tileset = this._tileset;
    const parentGeometricError = defined(this.parent) ? this.parent.geometricError : tileset._geometricError;
    const geometricError = useParentGeometricError ? parentGeometricError : this.geometricError;
    if (geometricError === 0.0) {
      // Leaf tiles do not have any error so save the computation
      return 0.0;
    }
    const camera = frameState.camera;
    const frustum = camera.frustum;
    const context = frameState.context;
    const width = context.drawingBufferWidth;
    const height = context.drawingBufferHeight;
    let error;
    if (frameState.mode === SceneMode.SCENE2D || frustum instanceof OrthographicFrustum) {
      if (defined(frustum._offCenterFrustum)) {
        frustum = frustum._offCenterFrustum;
      }
      const pixelSize = Math.max(frustum.top - frustum.bottom, frustum.right - frustum.left) / Math.max(width, height);
      error = geometricError / pixelSize;
    } else {
      // Avoid divide by zero when viewer is inside the tile
      const distance = Math.max(this._distanceToCamera, CesiumMath.EPSILON7);
      const sseDenominator = camera.frustum.sseDenominator;
      error = (geometricError * height) / (distance * sseDenominator);
      if (tileset.dynamicScreenSpaceError) {
        const density = tileset._dynamicScreenSpaceErrorComputedDensity;
        const factor = tileset.dynamicScreenSpaceErrorFactor;
        const dynamicError = CesiumMath.fog(distance, density) * factor;
        error -= dynamicError;
      }
    }
    return error;

}

### updateVisibility(frameState) {

Update the tile's visibility.
@private

updateExpiration() {
/\*_
Update whether the tile has expired.
_
@private
\*/
if (defined(this.expireDate) && this.contentReady && !this.hasEmptyContent) {
const now = JulianDate.now(scratchJulianDate);
if (JulianDate.lessThan(this.expireDate, now)) {
this.\_contentState = Tile3DContentState.EXPIRED;
this.\_expiredContent = this.\_content;
}
}
}

### requestContent()

Requests the tile's content.

<p>
The request may not be made if the Cesium Request Scheduler can't prioritize it.
</p>
   *

### unloadContent()

Unloads the tile's content.

### visibility(frameState, parentVisibilityPlaneMask) {

/\*_
Determines whether the tile's bounding volume intersects the culling volume.
_
@param {FrameState} frameState The frame state.
@param {Number} parentVisibilityPlaneMask The parent's plane mask to speed up the visibility check.
@returns {Number} A plane mask as described above in {@link CullingVolume#computeVisibilityWithPlaneMask}.
_
@private
_/

### contentVisibility(frameState)

/\*_
Assuming the tile's bounding volume intersects the culling volume, determines
whether the tile's content's bounding volume intersects the culling volume.
_
@param {FrameState} frameState The frame state.
@returns {Intersect} The result of the intersection: the tile's content is completely outside, completely inside, or intersecting the culling volume.
_
@private
_/
// Assumes the tile's bounding volume intersects the culling volume already, so
// just return Intersect.INSIDE if there is no content bounding volume.
if (!defined(this.\_contentBoundingVolume)) {
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
    const boundingVolume = getContentBoundingVolume(this, frameState);

    const tileset = this._tileset;
    const clippingPlanes = tileset.clippingPlanes;
    if (defined(clippingPlanes) && clippingPlanes.enabled) {
      const intersection = clippingPlanes.computeIntersectionWithBoundingVolume(boundingVolume, tileset.clippingPlanesOriginMatrix);
      this._isClipped = intersection !== Intersect.INSIDE;
      if (intersection === Intersect.OUTSIDE) {
        return Intersect.OUTSIDE;
      }
    }

    return cullingVolume.computeVisibility(boundingVolume);

}

### distanceToTile(frameState) : Number

Computes the (potentially approximate) distance from the closest point of the tile's bounding volume to the camera.
_
@param {FrameState} frameState The frame state.
@returns {Number} The distance, in meters, or zero if the camera is inside the bounding volume.
_
@private
\*/

### distanceToTileCenter(frameState)

- Computes the distance from the center of the tile's bounding volume to the camera.
-
- @param {FrameState} frameState The frame state.
- @returns {Number} The distance, in meters.
-
- @private
  \*/

### insideViewerRequestVolume(frameState) : Boolean

- Checks if the camera is inside the viewer request volume.
-
- @param {FrameState} frameState The frame state.
- @returns {Boolean} Whether the camera is inside the volume.
-

/\*\*

- Create a bounding volume from the tile's bounding volume header.
-
- @param {Object} boundingVolumeHeader The tile's bounding volume header.
- @param {Matrix4} transform The transform to apply to the bounding volume.
- @param {TileBoundingVolume} [result] The object onto which to store the result.
-
- @returns {TileBoundingVolume} The modified result parameter or a new TileBoundingVolume instance if none was provided.
-
- @private
  \*/
  createBoundingVolume(boundingVolumeHeader, transform, result) {

/\*\*

- Update the tile's transform. The transform is applied to the tile's bounding volumes.
-
- @private
  \*/
  updateTransform(parentTransform) {
  parentTransform = defaultValue(parentTransform, Matrix4.IDENTITY);
  const computedTransform = Matrix4.multiply(parentTransform, this.transform, scratchTransform);
  const transformChanged = !Matrix4.equals(computedTransform, this.computedTransform);

  if (!transformChanged) {
  return;
  }

  Matrix4.clone(computedTransform, this.computedTransform);

  // Update the bounding volumes
  const header = this.\_header;
  const content = this.\_header.content;
  this.\_boundingVolume = this.createBoundingVolume(header.boundingVolume, this.computedTransform, this.\_boundingVolume);
  if (defined(this.\_contentBoundingVolume)) {
  this.\_contentBoundingVolume = this.createBoundingVolume(content.boundingVolume, this.computedTransform, this.\_contentBoundingVolume);
  }
  if (defined(this.\_viewerRequestVolume)) {
  this.\_viewerRequestVolume = this.createBoundingVolume(header.viewerRequestVolume, this.computedTransform, this.\_viewerRequestVolume);
  }

  // Destroy the debug bounding volumes. They will be generated fresh.
  this.\_debugBoundingVolume = this.\_debugBoundingVolume && this.\_debugBoundingVolume.destroy();
  this.\_debugContentBoundingVolume = this.\_debugContentBoundingVolume && this.\_debugContentBoundingVolume.destroy();
  this.\_debugViewerRequestVolume = this.\_debugViewerRequestVolume && this.\_debugViewerRequestVolume.destroy();
  };

/\*\*

- Get the draw commands needed to render this tile.
-
- @private
  \*/
  update(tileset, frameState) {
  const initCommandLength = frameState.commandList.length;
  updateClippingPlanes(this, tileset);
  applyDebugSettings(this, tileset, frameState);
  updateContent(this, tileset, frameState);
  this.\_commandsLength = frameState.commandList.length - initCommandLength;

  this.clippingPlanesDirty = false; // reset after content update
  };

/\*_
Processes the tile's content, e.g., create WebGL resources, to move from the PROCESSING to READY state.
_
@param {Tileset3D} tileset The tileset containing this tile.
@param {FrameState} frameState The frame state.
_
@private
_/
process(tileset, frameState) {
const savedCommandList = frameState.commandList;
frameState.commandList = scratchCommandList;

    this._content.update(tileset, frameState);

    scratchCommandList.length = 0;
    frameState.commandList = savedCommandList;

}

\_initialize(tileset, baseResource, header, parent) {
this.\_tileset = tileset;
this.\_header = header;

    const contentHeader = header.content;

    /**

The local transform of this tile.
@type {Matrix4}
\*/
this.transform = defined(header.transform) ? Matrix4.unpack(header.transform) : Matrix4.clone(Matrix4.IDENTITY);

    const parentTransform = defined(parent) ? parent.computedTransform : tileset.modelMatrix;
    const computedTransform = Matrix4.multiply(parentTransform, this.transform, new Matrix4());

    const parentInitialTransform = defined(parent) ? parent._initialTransform : Matrix4.IDENTITY;
    this._initialTransform = Matrix4.multiply(parentInitialTransform, this.transform, new Matrix4());

    /**

The final computed transform of this tile.
@type {Matrix4}
@readonly
\*/
this.computedTransform = computedTransform;

    this._boundingVolume = this.createBoundingVolume(header.boundingVolume, computedTransform);
    this._boundingVolume2D = undefined;

    const contentBoundingVolume;

    if (defined(contentHeader) && defined(contentHeader.boundingVolume)) {
      // Non-leaf tiles may have a content bounding-volume, which is a tight-fit bounding volume
      // around only the features in the tile.  This box is useful for culling for rendering,
      // but not for culling for traversing the tree since it does not guarantee spatial coherence, i.e.,
      // since it only bounds features in the tile, not the entire tile, children may be
      // outside of this box.
      contentBoundingVolume = this.createBoundingVolume(contentHeader.boundingVolume, computedTransform);
    }
    this._contentBoundingVolume = contentBoundingVolume;
    this._contentBoundingVolume2D = undefined;

    const viewerRequestVolume;
    if (defined(header.viewerRequestVolume)) {
      viewerRequestVolume = this.createBoundingVolume(header.viewerRequestVolume, computedTransform);
    }
    this._viewerRequestVolume = viewerRequestVolume;

    /**

The error, in meters, introduced if this tile is rendered and its children are not.
This is used to compute screen space error, i.e., the error measured in pixels.
_
@type {Number}
@readonly
_/
this.geometricError = header.geometricError;

    if (!defined(this.geometricError)) {
      this.geometricError = defined(parent) ? parent.geometricError : tileset._geometricError;
      Tile3D._deprecationWarning('geometricErrorUndefined', 'Required property geometricError is undefined for this tile. Using parent\'s geometric error instead.');
    }

    const refine;
    if (defined(header.refine)) {
      if (header.refine === 'replace' || header.refine === 'add') {
        Tile3D._deprecationWarning('lowercase-refine', 'This tile uses a lowercase refine "' + header.refine + '". Instead use "' + header.refine.toUpperCase() + '".');
      }
      refine = (header.refine.toUpperCase() === 'REPLACE') ? Tile3DRefine.REPLACE : Tile3DRefine.ADD;
    } else if (defined(parent)) {
      // Inherit from parent tile if omitted.
      refine = parent.refine;
    } else {
      refine = Tile3DRefine.REPLACE;
    }

    /**

Specifies the type of refinement that is used when traversing this tile for rendering.
_
@type {Tile3DRefine}
@readonly
@private
_/
this.refine = refine;

    /**

Gets the tile's children.
_
@type {Tile3D[]}
@readonly
_/
this.children = [];

    /**

This tile's parent or <code>undefined</code> if this tile is the root.

  <p>
  When a tile's content points to an external tileset JSON file, the external tileset's
  root tile's parent is not <code>undefined</code>; instead, the parent references
  the tile (with its content pointing to an external tileset JSON file) as if the two tilesets were merged.
  </p>
     *
  @type {Tile3D}
  @readonly
     */
    this.parent = parent;

    let content;
    let hasEmptyContent;
    let contentState;
    let contentResource;
    let serverKey;

    baseResource = Resource.createIfNeeded(baseResource);

    if (defined(contentHeader)) {
      const contentHeaderUri = contentHeader.uri;
      if (defined(contentHeader.url)) {
        Tile3D._deprecationWarning('contentUrl', 'This tileset JSON uses the "content.url" property which has been deprecated. Use "content.uri" instead.');
        contentHeaderUri = contentHeader.url;
      }
      hasEmptyContent = false;
      contentState = Tile3DContentState.UNLOADED;
      contentResource = baseResource.getDerivedResource({
        url : contentHeaderUri
      });
      serverKey = RequestScheduler.getServerKey(contentResource.getUrlComponent());
    } else {
      content = new Empty3DTileContent(tileset, this);
      hasEmptyContent = true;
      contentState = Tile3DContentState.READY;
    }

    this._content = content;
    this._contentResource = contentResource;
    this._contentState = contentState;
    this._contentReadyToProcessPromise = undefined;
    this._contentReadyPromise = undefined;
    this._expiredContent = undefined;

    this._serverKey = serverKey;

    /**

When <code>true</code>, the tile has no content.
_
@type {Boolean}
@readonly
_
@private
\*/
this.hasEmptyContent = hasEmptyContent;

    /**

When <code>true</code>, the tile's content points to an external tileset.

  <p>
  This is <code>false</code> until the tile's content is loaded.
  </p>
     *
  @type {Boolean}
  @readonly
     *
  @private
     */
    this.hasTilesetContent = false;

    /**

The node in the tileset's LRU cache, used to determine when to unload a tile's content.
_
See {@link Tileset3DCache}
_
@type {DoublyLinkedListNode}
@readonly
_
@private
_/
this.cacheNode = undefined;

    let expire = header.expire;
    let expireDuration;
    let expireDate;
    if (defined(expire)) {
      expireDuration = expire.duration;
      if (defined(expire.date)) {
        expireDate = JulianDate.fromIso8601(expire.date);
      }
    }

    /**

The time in seconds after the tile's content is ready when the content expires and new content is requested.
_
@type {Number}
_/
this.expireDuration = expireDuration;

    /**

The date when the content expires and new content is requested.
_
@type {JulianDate}
_/
this.expireDate = expireDate;

    /**

The time when a style was last applied to this tile.
_
@type {Number}
_
@private
\*/
this.lastStyleTime = 0;

    /**

Marks whether the tile's children bounds are fully contained within the tile's bounds
_
@type {Tile3DOptimizationHint}
_
@private
\*/
this.\_optimChildrenWithinParent = Tile3DOptimizationHint.NOT_COMPUTED;

    /**

Tracks if the tile's relationship with a ClippingPlaneCollection has changed with regards
to the ClippingPlaneCollection's state.
_
@type {Boolean}
_
@private
\*/
this.clippingPlanesDirty = false;

    // Members that are updated every frame for tree traversal and rendering optimizations:
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
    this._isClipped = true;
    this._clippingPlanesState = 0; // encapsulates (_isClipped, clippingPlanes.enabled) and number/function
    this._debugBoundingVolume = undefined;
    this._debugContentBoundingVolume = undefined;
    this._debugViewerRequestVolume = undefined;
    this._debugColor = Color.fromRandom({ alpha : 1.0 });
    this._debugColorizeTiles = false;

    this._commandsLength = 0;

    this._color = undefined;
    this._colorDirty = false;

}
}

function applyDebugSettings(tile, tileset, frameState) {
if (!frameState.passes.render) {
return;
}

const hasContentBoundingVolume = defined(tile.\_header.content) && defined(tile.\_header.content.boundingVolume);
const empty = tile.hasEmptyContent || tile.hasTilesetContent;

const showVolume = tileset.debugShowBoundingVolume || (tileset.debugShowContentBoundingVolume && !hasContentBoundingVolume);
if (showVolume) {
const color;
if (!tile.\_finalResolution) {
color = Color.YELLOW;
} else if (empty) {
color = Color.DARKGRAY;
} else {
color = Color.WHITE;
}
if (!defined(tile.\_debugBoundingVolume)) {
tile.\_debugBoundingVolume = tile.\_boundingVolume.createDebugVolume(color);
}
tile.\_debugBoundingVolume.update(frameState);
const attributes = tile.\_debugBoundingVolume.getGeometryInstanceAttributes('outline');
attributes.color = ColorGeometryInstanceAttribute.toValue(color, attributes.color);
} else if (!showVolume && defined(tile.\_debugBoundingVolume)) {
tile.\_debugBoundingVolume = tile.\_debugBoundingVolume.destroy();
}

if (tileset.debugShowContentBoundingVolume && hasContentBoundingVolume) {
if (!defined(tile.\_debugContentBoundingVolume)) {
tile.\_debugContentBoundingVolume = tile.\_contentBoundingVolume.createDebugVolume(Color.BLUE);
}
tile.\_debugContentBoundingVolume.update(frameState);
} else if (!tileset.debugShowContentBoundingVolume && defined(tile.\_debugContentBoundingVolume)) {
tile.\_debugContentBoundingVolume = tile.\_debugContentBoundingVolume.destroy();
}

if (tileset.debugShowViewerRequestVolume && defined(tile.\_viewerRequestVolume)) {
if (!defined(tile.\_debugViewerRequestVolume)) {
tile.\_debugViewerRequestVolume = tile.\_viewerRequestVolume.createDebugVolume(Color.YELLOW);
}
tile.\_debugViewerRequestVolume.update(frameState);
} else if (!tileset.debugShowViewerRequestVolume && defined(tile.\_debugViewerRequestVolume)) {
tile.\_debugViewerRequestVolume = tile.\_debugViewerRequestVolume.destroy();
}

const debugColorizeTilesOn = tileset.debugColorizeTiles && !tile.\_debugColorizeTiles;
const debugColorizeTilesOff = !tileset.debugColorizeTiles && tile.\_debugColorizeTiles;

if (debugColorizeTilesOn) {
tile.\_debugColorizeTiles = true;
tile.color = tile.\_debugColor;
} else if (debugColorizeTilesOff) {
tile.\_debugColorizeTiles = false;
tile.color = Color.WHITE;
}

if (tile.\_colorDirty) {
tile.\_colorDirty = false;
tile.\_content.applyDebugSettings(true, tile.\_color);
}

if (debugColorizeTilesOff) {
tileset.makeStyleDirty(); // Re-apply style now that colorize is switched off
}
}

function updateContent(tile, tileset, frameState) {
const content = tile.\_content;
const expiredContent = tile.\_expiredContent;

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

function updateClippingPlanes(tile, tileset) {
// Compute and compare ClippingPlanes state:
// - enabled-ness - are clipping planes enabled? is this tile clipped?
// - clipping plane count
// - clipping function (union v. intersection)
const clippingPlanes = tileset.clippingPlanes;
const currentClippingPlanesState = 0;
if (defined(clippingPlanes) && tile.\_isClipped && clippingPlanes.enabled) {
currentClippingPlanesState = clippingPlanes.clippingPlanesState;
}
// If clippingPlaneState for tile changed, mark clippingPlanesDirty so content can update
if (currentClippingPlanesState !== tile.\_clippingPlanesState) {
tile.\_clippingPlanesState = currentClippingPlanesState;
tile.clippingPlanesDirty = true;
}
}

function updateExpireDate(tile) {
if (defined(tile.expireDuration)) {
const expireDurationDate = JulianDate.now(scratchJulianDate);
JulianDate.addSeconds(expireDurationDate, tile.expireDuration, expireDurationDate);

    if (defined(tile.expireDate)) {
      if (JulianDate.lessThan(tile.expireDate, expireDurationDate)) {
        JulianDate.clone(expireDurationDate, tile.expireDate);
      }
    } else {
      tile.expireDate = JulianDate.clone(expireDurationDate);
    }

}
}

function getContentFailedFunction(tile) {
return function(error) {
tile.\_contentState = Tile3DContentState.FAILED;
tile.\_contentReadyPromise.reject(error);
tile.\_contentReadyToProcessPromise.reject(error);
};
}

function createPriorityFunction(tile) {
return function() {
return tile.\_priority;
};
}

const scratchProjectedBoundingSphere = new BoundingSphere();

function getBoundingVolume(tile, frameState) {
if (frameState.mode !== SceneMode.SCENE3D && !defined(tile.\_boundingVolume2D)) {
const boundingSphere = tile.\_boundingVolume.boundingSphere;
const sphere = BoundingSphere.projectTo2D(boundingSphere, frameState.mapProjection, scratchProjectedBoundingSphere);
tile.\_boundingVolume2D = new TileBoundingSphere(sphere.center, sphere.radius);
}

return frameState.mode !== SceneMode.SCENE3D ? tile.\_boundingVolume2D : tile.\_boundingVolume;
}

function getContentBoundingVolume(tile, frameState) {
if (frameState.mode !== SceneMode.SCENE3D && !defined(tile.\_contentBoundingVolume2D)) {
const boundingSphere = tile.\_contentBoundingVolume.boundingSphere;
const sphere = BoundingSphere.projectTo2D(boundingSphere, frameState.mapProjection, scratchProjectedBoundingSphere);
tile.\_contentBoundingVolume2D = new TileBoundingSphere(sphere.center, sphere.radius);
}
return frameState.mode !== SceneMode.SCENE3D ? tile.\_contentBoundingVolume2D : tile.\_contentBoundingVolume;
}
