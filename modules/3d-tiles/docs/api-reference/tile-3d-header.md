# Tile3DHeader

A `Tile3DHeader` represents a tile in a `Tileset3D`. When a tile is first created, its content is not loaded, and the content is loaded on-demand when needed based on the view.

## Properties

##### boundingVolume : BoundingVolume

A bounding volume that encloses a tile or its content. Exactly one box, region, or sphere property is required. ([`Reference`](https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/specification#bounding-volume))

##### id : Number:String

A unique number for the tile. Default to the url of the tile.

##### contentState : String

Indicate of the tile content state. Available options

- `UNLOADED`: Has never been requested or has been destroyed.
- `LOADING`: Is waiting on a pending request.
- `PROCESSING`: Contents are being processed for rendering. Depending on the content, it might make its own requests for external data.
- `READY`: All the resources are loaded and decoded.
- `FAILED`: Request failed.

##### contentType : String

One of

- `empty`: does not have any content to render
- `render`: has content to to render
- `tileset`: tileset tile

##### depth : Number

The depth of the tile in the tileset tree.

##### content : Object

The tile's content.This represents the actual tile's payload.

**Common content fields**

| Field                             | Type         | Contents                                                                                                                               |
| --------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `content.cartesianOrigin`         | `Number[3]`  | "Center" of tile geometry in WGS84 fixed frame coordinates                                                                             |
| `content.cartographicOrigin`      | `Number[3]`  | "Origin" in lng/lat (center of tile's bounding volume)                                                                                 |
| `content.cartesianModelMatrix`    | `Number[16]` | Transforms tile geometry positions to fixed frame coordinates                                                                          |
| `content.cartographicModelMatrix` | `Number[16]` | Transforms tile geometry positions to ENU meter offsets from `cartographicOrigin`.                                                     |
| `content.attributes`              | `Object`     | Each attribute follows luma.gl [accessor](https://github.com/uber/luma.gl/blob/master/docs/api-reference/webgl/accessor.md) properties |

`attributes` contains following fields

| Field                          | Type       | Contents                          |
| ------------------------------ | ---------- | --------------------------------- |
| `content.attributes.positions` | `Accessor` | `{value, type, size, normalized}` |
| `content.attributes.normals`   | `Accessor` | `{value, type, size, normalized}` |
| `content.attributes.colors`    | `Accessor` | `{value, type, size, normalized}` |

**PointCloud Fields**

| Field                | Type     | Contents                                                 |
| -------------------- | -------- | -------------------------------------------------------- |
| `content.pointCount` | Number   | Number of points                                         |
| `content.color`      | Number[] | Color of the tile when there are not `attributes.colors` |

**Scenegraph Fields**

| Field               | Type     | Contents                                                                                             |
| ------------------- | -------- | ---------------------------------------------------------------------------------------------------- |
| `content.gltf`      | `Object` | check [GLTFLoader](https://loaders.gl/modules/gltf/docs/api-reference/gltf-loader) for detailed spec |
| `content.instances` |          |                                                                                                      |

**SimpleMesh Fields**

| Field             | Type | Contents  |
| ----------------- | ---- | --------- |
| `content.texture` | URL  | Texture2D | texture of the tile |

##### layerType : String

One of `Scenegraph`, `PointCloud`, `SimpleMesh`

##### parent : Tile3DHeader

Parent of this tile.

###### refine : String

Specifies the type of refine that is used when traversing this tile for rendering.

- `ADD`: children tiles should be rendered together with parent tiles when level of details of parent tiles are not sufficient for current view.
- `REPLACEMENT`: Children tiles should replace parent tiles when level of details of parent tiles are not sufficient for current view.

##### selected : Boolean

Whether this tile is selected for rendering in current update frame and viewport. A selected tile should has its content loaded and satifies current viewport.

##### tileset : Tileset3D

The `Tileset3D` instance containing this tile.

##### header : Object

The unprocessed tile header object passed in.

## Methods

### constructor(tileset : Object, header : Object, parentHeader : Object)

- `tileset`: The loaded tileset (parsed JSON)
- `header`: The url to a tileset JSON file.
- `parentHeader`: The url to a tileset JSON file.

##### destroy()

Destroy the tile node, including destroy all the metadata and unload content.

##### loadContent()

Load a content of the tile.

##### unloadContent()

Unload a content of the tile.
