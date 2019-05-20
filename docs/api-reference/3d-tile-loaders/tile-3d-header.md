# Tile3DHeader (Experimental)

> The 3D tile loaders are still under development. If you are interested in early access, please open an issue.

Class that simplified access to data inside a tile in a `Tileset3D`.

Notes:

- When a tile is first created, its content is not loaded; the content is loaded on-demand when needed based on the view.

## Fields

### tileset : Tileset3D

The tileset containing this tile.

### content : Tile3DContent

The tile's content. This represents the actual tile's payload,
not the content's metadata in the tileset JSON file.

### boundingVolume : TileBoundingVolume

Get the tile's bounding volume.

### contentBoundingVolume : TileBoundingVolume

Get the bounding volume of the tile's contents. This defaults to the
tile's bounding volume when the content's bounding volume is
`undefined`.

### boundingSphere : BoundingSphere

Get the bounding sphere derived from the tile's bounding volume.

### extras : any

Returns the `extras` property in the tileset JSON for this tile, which contains application specific metadata.
Returns `undefined` if `extras` does not exist.

See [Extras in the 3D Tiles specification](https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/specification#specifying-extensions-and-application-specific-extras)

### contentAvailable : Boolean

Determines if the tile has available content to render. `true` if the tile's
content is ready or if it has expired content that renders while new content loads; otherwise,
`false`.

### contentReady : Boolean

Determines if the tile's content is ready. This is automatically `true` for
tile's with empty content.

### contentUnloaded : Boolean

Determines if the tile's content has not be requested. `true` if tile's
content has not be requested; otherwise, `false`.


### contentExpired : Boolean

Determines if the tile's content is expired. `true` if tile's
content is expired; otherwise, `false`.

### contentFailed : Boolean

Determines if the tile's content failed to load. `true` if the tile's
content failed to load; otherwise, `false`.

### contentReadyToProcessPromise : Promise

Gets the promise that will be resolved when the tile's content is ready to process.
This happens after the content is downloaded but before the content is ready
to render.

The promise remains `undefined` until the tile's content is requested.

### contentReadyPromise : Promise.Tile3DContent

Gets the promise that will be resolved when the tile's content is ready to render.

The promise remains `undefined` until the tile's content is requested.

### commandsLength : Number

Estimates the number of draw commands used by this tile.

## Methods

### constructor(tileset, baseResource, header, parent)

Note: Do not construct this directly, instead access tiles through {@link Tileset3D#tileVisible}.

### destroy()

Releases resources managed by this tile.

### getScreenSpaceError(frameState, useParentGeometricError) : Number

Get the tile's screen space error.

### updateVisibility(frameState) : void

Update the tile's visibility.

### requestContent()

Requests the tile's content.

The request may not be made if the Request Scheduler can't prioritize it.

### unloadContent()

Unloads the tile's content.

### visibility(frameState, parentVisibilityPlaneMask) {

Determines whether the tile's bounding volume intersects the culling volume.

@param {FrameState} frameState The frame state.
@param {Number} parentVisibilityPlaneMask The parent's plane mask to speed up the visibility check.
@returns {Number} A plane mask as described above in {@link CullingVolume#computeVisibilityWithPlaneMask}.


### contentVisibility(frameState)

Assuming the tile's bounding volume intersects the culling volume, determines
whether the tile's content's bounding volume intersects the culling volume.
@param {FrameState} frameState The frame state.
@returns {Intersect} The result of the intersection: the tile's content is completely outside, completely inside, or intersecting the culling volume.

### distanceToTile(frameState) : Number

Computes the (potentially approximate) distance from the closest point of the tile's bounding volume to the camera.
@param {FrameState} frameState The frame state.
@returns {Number} The distance, in meters, or zero if the camera is inside the bounding volume.

### distanceToTileCenter(frameState)

Computes the distance from the center of the tile's bounding volume to the camera.
@param {FrameState} frameState The frame state.
@returns {Number} The distance, in meters.

### insideViewerRequestVolume(frameState) : Boolean

Checks if the camera is inside the viewer request volume.

@param {FrameState} frameState The frame state.
@returns {Boolean} Whether the camera is inside the volume.

### createBoundingVolume(boundingVolumeHeader, transform, result) {

Create a bounding volume from the tile's bounding volume header.

@param {Object} boundingVolumeHeader The tile's bounding volume header.
@param {Matrix4} transform The transform to apply to the bounding volume.
@param {TileBoundingVolume} [result] The object onto which to store the result.

@returns {TileBoundingVolume} The modified result parameter or a new TileBoundingVolume instance if none was provided.


### updateTransform(parentTransform)

Update the tile's transform. The transform is applied to the tile's bounding volumes.

### transform

The local transform of this tile.
@type {Matrix4}

### computedTransform

The final computed transform of this tile.
@type {Matrix4}

The error, in meters, introduced if this tile is rendered and its children are not.


### geometricError : number

This is used to compute screen space error, i.e., the error measured in pixels.

### refinement : 3DTileRefine

Specifies the type of refinement that is used when traversing this tile for rendering.

### children : Tile3dHeader[]

Gets the tile's children.

### parent : Tile3DHeader | null;

This tile's parent or `undefined` if this tile is the root.

When a tile's content points to an external tileset JSON file, the external tileset's root tile's parent is not `undefined`; instead, the parent references the tile (with its content pointing to an external tileset JSON file) as if the two tilesets were merged.


### hasEmptyContent : boolean
When `true`, the tile has no content.

### hasTilesetContent : boolean

When `true`, the tile's content points to an external tileset.

This is `false` until the tile's content is loaded.



### expireDuration : Number

The time in seconds after the tile's content is ready when the content expires and new content is requested.

### expireDate : JulianDate

The date when the content expires and new content is requested.

### lastStyleTime ; Number

The time when a style was last applied to this tile.

Marks whether the tile's children bounds are fully contained within the tile's bounds

### optimChildrenWithinParent : Tile3DOptimizationHint = Tile3DOptimizationHint.NOT_COMPUTED;

Tracks if the tile's relationship with a ClippingPlaneCollection has changed with regards
to the ClippingPlaneCollection's state.
