# Tile3D

> The `Tile3D` class is used internally by `loaders.gl/tiles` `Tileset3D` class to manage loading/unloading tiles.

## Constructor

```js
new Tile3D(tileset, header, parentHeader);
```

Paremeters:

- `tileset` (Tileset3D) - `Tileset3D` instance which contains this tile
- `header` (Tile3D) - `Tile3D` instance
- `parentHeader` (Tile3D) - `Tile3D` instance of parent tile

#### Properties

###### `boundingVolume` (BoundingVolume)

A bounding volume that encloses a tile or its content. Exactly one box, region, or sphere property is required. ([`Reference`](https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/specification#bounding-volume))

###### `id` (Number`|`String)

A unique number for the tile in the tileset. Default to the url of the tile.

###### `contentState` (String)

Indicate of the tile content state. Available options

- `UNLOADED`: Has never been requested or has been destroyed.
- `LOADING`: Is waiting on a pending request.
- `PROCESSING`: Contents are being processed for rendering. Depending on the content, it might make its own requests for external data.
- `READY`: All the resources are loaded and decoded.
- `FAILED`: Request failed.

###### `contentType` (String)

One of

- `empty`: does not have any content to render
- `render`: has content to render
- `tileset`: tileset tile

##### `_selectionDepth` (Number)

The depth of the tile in the traversal tree.

###### `content` (Object)

The tile's content.This represents the actual tile's payload.

###### `type` (String)

One of `scenegraph`, `pointcloud`, `mesh`

###### `parent` (Tile3DHeader)

Parent of this tile.

###### `refine` (String)

Specifies the type of refine that is used when traversing this tile for rendering. [`Reference`](https://github.com/AnalyticalGraphicsInc/3d-tiles/blob/master/specification/README.md#refinement)

- `ADD`: high-resolution children tiles should be rendered in addition to lower-resolution parent tiles when level of details of parent tiles are not sufficient for current view.
- `REPLACEMENT`: high-resolution children tiles should replace parent tiles when lower-resolution parent tiles are not sufficient for current view.

###### `selected` (Boolean)

Whether this tile is selected for rendering in current update frame and viewport. A selected tile should has its content loaded and satifies current viewport.

###### `tileset` (Tileset3D)

The `Tileset3D` instance containing this tile.

###### `header` (Object)

The unprocessed tile header object passed in.

#### Methods

##### `destroy()`

Destroy the tile node, including destroy all the metadata and unload content.

##### `loadContent()`

Load a content of the tile.

##### `unloadContent()`

Unload a content of the tile.
