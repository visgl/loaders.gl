# Overview

`@loaders/tiles` exposes handy classes `Tileset3D` and `Tile3D` which can understand the loaded data from tile loaders (`@loaders.gl/3d-tiles`, `@loaders.gl/i3s`, etc.), and provide useful functions for dynamically selecting tiles for rendering under a viewport.

## Concepts

- [OGC 3D Tiles](https://www.opengeospatial.org/standards/3DTiles) standard
- [OGC i3s](https://www.opengeospatial.org/standards/i3s) standard
- **Tile Header Hierarchy** - An initial, "minimal" set of data listing the _hierarchy of available tiles_, with minimal information to allow an application to determine which tiles need to be loaded based on a certain viewing position in 3d space.
- **Tile Header** - A minimal header describing a tiles bounding volume and a screen space error tolerance (allowing the tile to be culled if it is distant), as well as the URL to load the tile's actual content from.
- **Tile Content** - The actual payload of the tile.
- **Tile Cache** - Since the number of tiles in big tilesets often exceed what can be loaded into available memory, it is important to have a system that releases no-longer visible tiles from memory.
- **Tileset Traversal** - Dynamically loading and rendering 3D tiles based on current viewing position, possibly triggering loads of new tiles and unloading of older, no-longer visible tiles.

### Tileset3D Class

#### Properties

- `boundingVolume` (`BoundingVolume`): The root tile's bounding volume, which is also the bouding volume of the entire tileset. Check `Tile3DHeader#boundingVolume`
- `cartesianCenter` (`Number[3]`): Center of tileset in fixed frame coordinates.
- `cartographicCenter` (`Number[3]`): Center of tileset in cartographic coordinates `[long, lat, elevation]`
- `ellipsoid` ([`Ellipsoid`](https://math.gl/modules/geospatial/docs/api-reference/ellipsoid)): Gets an ellipsoid describing the shape of the globe.
- `maximumMemoryUsage` (`Number`): If tiles sized more than `maximumMemoryUsage` are needed to for the current view, when these tiles go out of view, they will be unloaded.`maximumMemoryUsage` must be greater than or equal to zero.
- `modelMatrix` (`Matrix4: A [Matrix4](https://math.gl/modules/core/docs/api-reference/matrix4) instance (4x4 transformation matrix) that transforms the entire tileset.
- `root` (`Tile3DHeader`): The root tile header.
- tiles: Array<Tile3DHeader>: All the tiles that have been traversed.
- `stats` ([`Stats`](https://uber-web.github.io/probe.gl/docs/api-reference/log/stats))): An instance of a probe.gl `Stats` object that contains information on how many tiles have been loaded etc. Easy to display using a probe.gl `StatsWidget`.
- `tileset` (`Object`): The original tileset data this object instanced from.
- `tilesLoaded` (`Boolean`): When `true`, all tiles that meet the screen space error this frame are loaded. The tileset is completely loaded for this view.
- `totalMemoryUsageInBytes` (`Number`): The total amount of GPU memory in bytes used by the tileset. This value is estimated from geometry, texture, and batch table textures of loaded tiles. For point clouds, this value also includes per-point metadata.
- `url` (`String`): The url to a tileset JSON file.
- `zoom` (`Number[3]`): A web mercator zoom level that displays the entire tile set bounding volume

#### Methods

- `constructor(tileset : Object, url : String [, options : Object])`
  - `tileset`: The loaded tileset (parsed JSON). See [Tileset Object Format](#tileset-object).
  - `options`: Options object, but not limited to
    Parameters:
    - `modelMatrix`=`Matrix4.IDENTITY` (`Matrix4`) - A 4x4 transformation matrix that transforms the tileset's root tile.
    - `maximumMemoryUsage`=`512`] (`Number`) - The maximum amount of memory in MB that can be used by the tileset.
    - `ellipsoid`=`Ellipsoid.WGS84` ([`Ellipsoid`](https://math.gl/modules/geospatial/docs/api-reference/ellipsoid)) - The ellipsoid determining the size and shape of the globe.
      Callbacks:
    - `onTileLoad` (`(tileHeader : Tile3DHeader) : void`) - callback when a tile node is fully loaded during the tileset traversal.
    - `onTileUnload` (`(tileHeader : Tile3DHeader) : void`) - callback when a tile node is unloaded during the tileset traversal.
    - `onTileError` (`(tileHeader : Tile3DHeader, message : String) : void`) - callback when a tile faile to load during the tileset traversal.
- `update(viewport: WebMercatorViewport) : Number`: Execute traversal under current viewport and fetch tiles needed for current viewport and update `selectedTiles`. Return `frameNumber` of this update frame.
- `destroy() : void`: Destroys the WebGL resources held by this object, and destroy all the tiles' resources by recursively traversing the tileset tree.

### Tile3D Class

#### Properties

- `boundingVolume` (`BoundingVolume`): A bounding volume that encloses a tile or its content. Exactly one box, region, or sphere property is required. ([`Reference`](https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/specification#bounding-volume))
- `id` (`Number`|`String`): A unique number for the tile in the tileset. Default to the url of the tile.
- `contentState` (`String`): Indicate of the tile content state. Available options
  - `UNLOADED`: Has never been requested or has been destroyed.
  - `LOADING`: Is waiting on a pending request.
  - `PROCESSING`: Contents are being processed for rendering. Depending on the content, it might make its own requests for external data.
  - `READY`: All the resources are loaded and decoded.
  - `FAILED`: Request failed.
- `contentType` (`String`): One of
  - `empty`: does not have any content to render
  - `render`: has content to render
  - `tileset`: tileset tile
- `depth` (`Number`): The depth of the tile in the tileset tree.
- `content` (`Object`): The tile's content.This represents the actual tile's payload.
- `type` (`String`): One of `scenegraph`, `pointcloud`, `simplemesh`
- `parent` (`Tile3DHeader`): Parent of this tile.
- `refine` (`String`): Specifies the type of refine that is used when traversing this tile for rendering. [`Reference`](https://github.com/AnalyticalGraphicsInc/3d-tiles/blob/master/specification/README.md#refinement)
  - `ADD`: high-resolution children tiles should be rendered in addition to lower-resolution parent tiles when level of details of parent tiles are not sufficient for current view.
  - `REPLACEMENT`: high-resolution children tiles should replace parent tiles when lower-resolution parent tiles are not sufficient for current view.
- `selected` (`Boolean`): Whether this tile is selected for rendering in current update frame and viewport. A selected tile should has its content loaded and satifies current viewport.
- `tileset` (`Tileset3D`): The `Tileset3D` instance containing this tile.
- `header` (`Object`): The unprocessed tile header object passed in.

#### Methods

- `constructor(tileset : Object, header : Object, parentHeader : Object)`
  - `tileset`: The loaded tileset (parsed JSON)
  - `header`: The loaded tile header file. See [Tile Object Format](#tile-object).
  - `parentHeader`: The loaded parent file.
- `destroy()`: Destroy the tile node, including destroy all the metadata and unload content.
- `loadContent()`: Load a content of the tile.
- `unloadContent()`: Unload a content of the tile.

## Data Format

This section specifies the unified data formats from tileset loader and tile loader.

### Tileset Object

The following fields are guaranteed. But different tileset loaders may have different extra fields.

| Field  | Type     | Contents                                                                      |
| ------ | -------- | ----------------------------------------------------------------------------- |
| `root` | `Object` | The root tile header object                                                   |
| `url`  | `Object` | The root tile header object                                                   |
| `type` | `String` | Indicate the type of tileset specification, `3d-tiles`, `i3s`, `potree`, etc. |

### Tile Object

The following fields are guaranteed. But different tile loaders may have different extra fields.

| Field             | Type         | Contents                                                                                                                                                                                                                                                                                                                            |
| ----------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `boundingVolume`  | `Object`     | A bounding volume that encloses a tile or its content. Exactly one box, region, or sphere property is required. ([`Reference`](https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/specification#bounding-volume))                                                                                                        |
| `children`        | `Array`      | An array of objects that define child tiles. Each child tile content is fully enclosed by its parent tile's bounding volume and, generally, has more details than parent. for leaf tiles, the length of this array is zero, and children may not be defined.                                                                        |
| `content`         | `String`     | The actual payload of the tile or the url point to the actual payload.                                                                                                                                                                                                                                                              |
| `id`              | `String`     | Identifier of the tile, unique in a tileset                                                                                                                                                                                                                                                                                         |
| `lodSelection`    | `Object`     | Used for deciding if this tile is sufficient given current viewport. Cesium tile use [`geometricError`](https://github.com/AnalyticalGraphicsInc/3d-tiles/blob/master/specification/README.md#geometric-error), `i3s` uses [`metricType` and `maxError`](https://github.com/Esri/i3s-spec/blob/master/docs/1.7/lodSelection.cmn.md) |
| `refine`          | `String`     | Refinement type of the tile, `ADD` or `REPLACE`                                                                                                                                                                                                                                                                                     |
| `type`            | `String`     | Type of the tile, one of `pointcloud`, `scenegraph`, `simplemesh`                                                                                                                                                                                                                                                                   |
| `transformMatrix` | `Number[16]` | A matrix that transforms from the tile's local coordinate system to the parent tile's coordinate system—or the tileset's coordinate system in the case of the root tile                                                                                                                                                             |  |

### Tile Content

After content is loaded, the following fields are guaranteed. But different tiles may have different extra content fields.

| Field                | Type         | Contents                                                                                                                               |
| -------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `cartesianOrigin`    | `Number[3]`  | "Center" of tile geometry in WGS84 fixed frame coordinates                                                                             |
| `cartographicOrigin` | `Number[3]`  | "Origin" in lng/lat (center of tile's bounding volume)                                                                                 |
| `modelMatrix`        | `Number[16]` | Transforms tile geometry positions to fixed frame coordinates                                                                          |
| `attributes`         | `Object`     | Each attribute follows luma.gl [accessor](https://github.com/uber/luma.gl/blob/master/docs/api-reference/webgl/accessor.md) properties |

`attributes` contains following fields

| Field                  | Type     | Contents                          |
| ---------------------- | -------- | --------------------------------- |
| `attributes.positions` | `Object` | `{value, type, size, normalized}` |
| `attributes.normals`   | `Object` | `{value, type, size, normalized}` |
| `attributes.colors`    | `Object` | `{value, type, size, normalized}` |

PointCloud Fields

| Field        | Type                       | Contents                                                 |
| ------------ | -------------------------- | -------------------------------------------------------- |
| `pointCount` | `Number`                   | Number of points                                         |
| `color`      | `Number[3]` or `Number[4]` | Color of the tile when there are not `attributes.colors` |

Scenegraph Fields

| Field  | Type     | Contents                                                                                             |
| ------ | -------- | ---------------------------------------------------------------------------------------------------- |
| `gltf` | `Object` | check [GLTFLoader](https://loaders.gl/modules/gltf/docs/api-reference/gltf-loader) for detailed spec |

SimpleMesh Fields

| Field     | Type | Contents              |
| --------- | ---- | --------------------- |
| `texture` | URL  | url of tile's texture |

## Additional Information

### Coordinate Systems

To help applications process the `position` data in the tiles, 3D Tiles category loaders are expected to provide matrices are provided to enable tiles to be used in both fixed frame or cartographic (long/lat-relative, east-north-up / ENU) coordinate systems:

- _cartesian_ WGS84 fixed frame coordinates
- _cartographic_ tile geometry positions to ENU meter offsets from `cartographicOrigin`.

Position units in both cases are in meters.

For cartographic coordinates, tiles come with a prechosen cartographic origin and precalculated model matrix. This cartographic origin is "arbitrary" (chosen based on the tiles bounding volume center). A different origin can be chosen and a transform can be calculated, e.g. using the math.gl `Ellipsoid` class.
