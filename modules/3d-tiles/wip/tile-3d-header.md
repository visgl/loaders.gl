# Tile3DHeader

> The 3D tile loaders are still under development.

The `Tile3DHeader` class contains sufficient information about each tile in the tileset to determine if that tile is visible from a certain viewing position (this information includes the tiles' bounding box, the list of its child tiles and a screen space error limit).


Notes:
- `Tile3DHeader`s are instantiated by the `Tileset3D` class for all the tiles in the tileset.
- Additional `Tile3DHeader` instances can be created when 
- When a tile is first created, its content is not loaded; the content is loaded on-demand when that tile is determined to be in the view.

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



## Methods

### constructor(tileset, baseResource, header, parent)

Note: Do not construct this directly, instead access tiles through {@link Tileset3D#tileVisible}.

### destroy()

Releases resources managed by this tile.

### getScreenSpaceError(frameState, useParentGeometricError) : Number

Get the tile's screen space error.

### updateVisibility(frameState) : void

Update the tile's visibility.

### loadContent()

Requests the tile's content.

### unloadContent()

Unloads the tile's content.

### visibility(frameState : FrameState, parentVisibilityPlaneMask : Number)

Determines whether the tile's bounding volume intersects the culling volume.

- `frameState` The frame state.
- `parentVisibilityPlaneMask` The parent's plane mask to speed up the visibility check.

Returns
- `Number` A plane mask as described in `CullingVolume.computeVisibilityWithPlaneMask`.


### contentVisibility(frameState : FrameState)

Assuming the tile's bounding volume intersects the culling volume, determines
whether the tile's content's bounding volume intersects the culling volume.
- FrameState frameState The frame state.

Returns
{Intersect} The result of the intersection: the tile's content is completely outside, completely inside, or intersecting the culling volume.

### distanceToTile(frameState : FrameState) : Number

Computes the (potentially approximate) distance from the closest point of the tile's bounding volume to the camera.
- FrameState frameState The frame state.

Returns
- `Number` The distance, in meters, or zero if the camera is inside the bounding volume.

### distanceToTileCenter(frameState : FrameState)

Computes the distance from the center of the tile's bounding volume to the camera.
- FrameState frameState The frame state.

Returns
- `Number` The distance, in meters.

### insideViewerRequestVolume(frameState : FrameState) : Boolean

Checks if the camera is inside the viewer request volume.

- `FrameState` frameState The frame state.

Returns
- `Boolean` Whether the camera is inside the volume.
