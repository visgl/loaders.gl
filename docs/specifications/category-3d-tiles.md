# Category: 3D Tiles

> The 3D tiles category is still under development.

The 3D Tiles category defines a generalized, slightly abstracted representation of hierarchical geospatial data structures.

It is being defined to be able to represent the [OGC 3D Tiles](https://www.opengeospatial.org/standards/3DTiles) standard but is intended to be generalized and extended to handle the similar formats, potentially such as [OGC i3s](https://www.opengeospatial.org/standards/i3s) standard and the `potree` format as well.

## Concepts

- **Tile Header Hierarchy** - An initial, "minimal" set of data listing the _hierarchy of available tiles_, with minimal information to allow an application to determine which tiles need to be loaded based on a certain viewing position in 3d space.
- **Tile Header** - A minimal header describing a tiles bounding volume and a screen space error tolerance (allowing the tile to be culled if it is distant), as well as the URL to load the tile's actual content from.
- **Tile Cache** - Since the number of tiles in big tilesets often exceed what can be loaded into available memory, it is important to have a system that releases no-longer visible tiles from memory.
- **Tileset Traversal** - Dynamically loading and rendering 3D tiles based on current viewing position, possibly triggering loads of new tiles and unloading of older, no-longer visible tiles.

## Tileset Traversal Support

To start loading tiles once a top-level tileset file is loaded, the application can instantiate the `Tileset3D` class and start calling `tileset3D.traverse(camera_parameters)`.

Since 3D tiled data sets tend to be very big, the key idea is to only load the tiles actually needed to show a view from the current camera position.

The `Tileset3D` allows callbacks (`onTileLoad`, `onTileUnload`) to be registered that notify the app when the set of tiles available for rendering has changed. This is important because tile loads complete asynchronously, after the `tileset3D.traverse(...)` call has returned.

## Coordinate Systems

To help applications process the `position` data in the tiles, 3D Tiles category loaders are expected to provide matrices are provided to enable tiles to be used in both fixed frame or cartographic (long/lat-relative, east-north-up / ENU) coordinate systems:

- _cartesian_ WGS84 fixed frame coordinates
- _cartographic_ tile geometry positions to ENU meter offsets from `cartographicOrigin`.

Position units in both cases are in meters.

For cartographic coordinates, tiles come with a prechosen cartographic origin and precalculated model matrix. This cartographic origin is "arbitrary" (chosen based on the tiles bounding volume center). A different origin can be chosen and a transform can be calculated, e.g. using the math.gl `Ellipsoid` class.

## Tileset Fields

| Field                | Type                | Contents                                                                    |
| -------------------- | ------------------- | --------------------------------------------------------------------------- |
| `asset`              | `Object` (Optional) |                                                                             |
| `root`               | `Object`            | The root tile header                                                        |
| `cartesianCenter`    | `Number[3]`         | Center of tileset in fixed frame coordinates                                |
| `cartographicCenter` | `Number[3]`         | Center of tileset in cartographic coordinates `[long, lat, elevation]`      |
| `webMercatorZoom`    | `Number[3]`         | A web mercator zoom level that displays the entire tile set bounding volume |

## TileHeader Fields

| Field            | Type     | Contents |
| ---------------- | -------- | -------- |
| `boundingVolume` | `Object` |          |

## Tile Fields

### Common Fields

| Field                     | Type                | Contents                                                                           |
| ------------------------- | ------------------- | ---------------------------------------------------------------------------------- |
| `loaderData`              | `Object` (Optional) | Format specific data                                                               |
| `version`                 | `Number`            | See [Header](#header)                                                              |
| `type`                    | `String`            | See [Mode](#mode)                                                                  |
| `cartesianOrigin`         | `Number[3]`         | "Center" of tile geometry in WGS84 fixed frame coordinates                         |
| `cartographicOrigin`      | `Number[3]`         | "Origin" in lng/lat (center of tile's bounding volume)                             |
| `cartesianModelMatrix`    | `Number[16]`        | Transforms tile geometry positions to fixed frame coordinates                      |
| `cartographicModelMatrix` | `Number[16]`        | Transforms tile geometry positions to ENU meter offsets from `cartographicOrigin`. |

### PointCloudTile Fields

| Field                        | Type           | Contents                                  |
| ---------------------------- | -------------- | ----------------------------------------- |
| `attributes`                 | `Object`       | Values are [accessor](#accessor) objects. |
| `attributes.positions.value` | `Float32Array` |                                           |
| `attributes.normals.value`   | `Float32Array` |                                           |
| `attributes.colors.value`    | `Uint8Array`   |                                           |

TBA - batch ids?

### Instanced3DModelTile Fields

| Field         | Type | Contents |
| ------------- | ---- | -------- |
| `modelMatrix` |      |          |

### PointCloudTile Fields

| Field | Type | Contents |
| ----- | ---- | -------- |


### CompositeTile Fields

| Field   | Type       | Contents                     |
| ------- | ---------- | ---------------------------- |
| `tiles` | `Object[]` | Array of parsed tile objects |

### Accessors

Following vis.gl conventions, `attributes` are represented by "glTF-style" accessor objects with the `value` field containing the binary data for that attribute stored in a typed array of the proper type.

| Accessors Fields | glTF? | Type         | Contents                                                                                                                     |
| ---------------- | ----- | ------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `value`          | No    | `TypedArray` | Contains the typed array (corresponds to `bufferView`). The type of the array will match the GL constant in `componentType`. |
| `size`           | No    | `Number`     | Number of components, `1`-`4`.                                                                                               |
| `byteOffset`     | Yes   | `Number`     | Starting offset into the bufferView.                                                                                         |
| `count`          | Yes   | `Number`     | The number of elements/vertices in the attribute data.                                                                       |
