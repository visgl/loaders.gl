# 3D Tiles Loaders

The 3D Tiles category defines a generalized representation of hierarchical geospatial data structures. Specific loaders for tiled 3D data return a standardized representation.

The 3D Tiles category can represent the major tiled 3D formats:

- [OGC 3D Tiles](https://www.opengeospatial.org/standards/3DTiles) standard
- [OGC i3s](https://www.opengeospatial.org/standards/i3s) standard
- `potree` format.

| Loader                                                                     | Notes |
| -------------------------------------------------------------------------- | ----- |
| [`Tiles3DLoader`](modules/3d-tiles/docs/api-reference/tiles-3d-loader)     |       |
| [`CesiumIonLoader`](modules/3d-tiles/docs/api-reference/cesium-ion-loader) |       |
| [`I3SLoader`](modules/i3s/docs/api-reference/i3s-loader)                   |       |
| [`PotreeLoader`](modules/potree/docs/api-reference/potree-loader)          |       |

## Concepts

- **Tile Header Hierarchy** - An initial, "minimal" set of data listing the _hierarchy of available tiles_, with minimal information to allow an application to determine which tiles need to be loaded based on a certain viewing position in 3d space.
- **Tile Header** - A minimal header describing a tiles bounding volume and a screen space error tolerance (allowing the tile to be culled if it is distant), as well as the URL to load the tile's actual content from.
- **Tile Cache** - Since the number of tiles in big tilesets often exceed what can be loaded into available memory, it is important to have a system that releases no-longer visible tiles from memory.
- **Tileset Traversal** - Dynamically loading and rendering 3D tiles based on current viewing position, possibly triggering loads of new tiles and unloading of older, no-longer visible tiles.

## Helper Classes

The `@loaders.gl/tiles` module provides classes that facilitate working with `3D Tiles` loader category data.

Tileset Traversal Support

To start loading tiles once a top-level tileset file is loaded, the application can instantiate the `Tileset3D` class and start calling `tileset3D.update(viewport)`.

Since 3D tiled data sets tend to be very big, the key idea is to only load the tiles actually needed to show a view from the current camera position.

The `Tileset3D` allows callbacks (`onTileLoad`, `onTileUnload`) to be registered that notify the app when the set of tiles available for rendering has changed. This is important because tile loads complete asynchronously, after the `tileset3D.update(...)` call has returned.

### Coordinate Systems

To help applications process the `position` data in the tiles, 3D Tiles category loaders are expected to provide matrices are provided to enable tiles to be used in both fixed frame or cartographic (long/lat-relative, east-north-up / ENU) coordinate systems:

- _cartesian_ WGS84 fixed frame coordinates
- _cartographic_ tile geometry positions to ENU meter offsets from `cartographicOrigin`.

Position units in both cases are in meters.

For cartographic coordinates, tiles come with a pre chosen cartographic origin and precalculated model matrix. This cartographic origin is "arbitrary" (chosen based on the tiles bounding volume center). A different origin can be chosen and a transform can be calculated, e.g. using the math.gl `Ellipsoid` class.

## Data Format

Loaders in the 3D Tiles category load data into a standardized format. This section specifies the data formats of objects loaded by 3D Tile category loaders.

Loaded data is typically returned in the form of pure data structures (rather than JavaScript classes), however for complex formats like 3D tiles, helper classes are provided which can be instantiated on the loaded data.

| Data Format  | Helper class                                        | Description                                                                                                                    |
| ------------ | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Tileset      |                                                     | Contains "global" metadata about the tileset.                                                                                  |
| Tile         |                                                     | Metadata for one tile. Includes bounding volumes required to determine if tile content needs to be loaded in a given viewport. |
| Tile Content | Actual content of a tile (geometry attributes etc). |

### Tileset Object

A single metadata object that needs to be loaded for each tileset. It contains "global" metadata and information that applies to all tiles in the tileset as well as information needed to correctly load additional tiles. The application is expected to keep a reference to the tileset object for each loaded tileset.

| Field            | Type     | Contents                                                                                                                                                                                                                                                                         |
| ---------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`           | `string` | Indicates the type of the tileset, for instance `i3s` tileset.                                                                                                                                                                                                                   |
| `url`            | `string` | The url of this tileset                                                                                                                                                                                                                                                          |
| `root`           | `Object` | The root tile header object                                                                                                                                                                                                                                                      |
| `lodMetricType`  | `string` | Root's level of detail (LoD) metric type, which is used to decide if a tile is sufficient for current viewport. Only support `maxScreenThreshold` for now. Check I3S [lodSelection](https://github.com/Esri/i3s-spec/blob/master/docs/1.7/lodSelection.cmn.md) for more details. |
| `lodMetricValue` | `Number` | Root's level of detail (LoD) metric value.                                                                                                                                                                                                                                       |

### Tile Object

The following fields are guaranteed. Additionally, the loaded tile object will contain all the data fetched from the provided url.

Tiles are often loaded in bulk, however they may be loaded in pages or

| Field            | Type     | Contents                                                                                                                                                                                                                                                                                 |
| ---------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`           | `string` | E.g. `mesh`.                                                                                                                                                                                                                                                                             |
| `id`             | `string` | Identifier of the tile, unique in a tileset                                                                                                                                                                                                                                              |
| `refine`         | `string` | Refinement type of the tile `ADD` or `REPLACE`                                                                                                                                                                                                                                           |
| `url`            | `string` | The url of this tile.                                                                                                                                                                                                                                                                    |
| `contentUrl`     | `string` | The url of this tile.                                                                                                                                                                                                                                                                    |
| `featureUrl`     | `string` | The url of this tile.                                                                                                                                                                                                                                                                    |
| `textureUrl`     | `string` | The url of this tile.                                                                                                                                                                                                                                                                    |
| `boundingVolume` | `Object` | A bounding volume in Cartesian coordinates converted from i3s node's [`mbs`](https://github.com/Esri/i3s-spec/blob/master/format/Indexed%203d%20Scene%20Layer%20Format%20Specification.md) that encloses a tile or its content. Exactly one box, region, or sphere property is required. |
| `lodMetricType`  | `string` | Level of Detail (LoD) metric type, which is used to decide if a tile is sufficient for current viewport. Only support `maxScreenThreshold` for now. Check I3S [lodSelection](https://github.com/Esri/i3s-spec/blob/master/docs/1.7/lodSelection.cmn.md) for more details.                |
| `lodMetricValue` | `string` | Level of Detail (LoD) metric value.                                                                                                                                                                                                                                                      |
| `children`       | `Array`  | An array of objects that define child tiles. Each child tile content is fully enclosed by its parent tile's bounding volume and, generally, has more details than parent. for leaf tiles, the length of this array is zero, and children may not be defined.                             |
| `content`        | `string` | The actual payload of the tile or the url point to the actual payload. If `option.loadContent` is enabled, content will be populated with the loaded value following the Tile Content section                                                                                            |

### Tile Content

After content is loaded, the following fields are guaranteed. But different tiles may have different extra content fields.

| Field                | Type         | Contents                                                                                                  |
| -------------------- | ------------ | --------------------------------------------------------------------------------------------------------- |
| `cartesianOrigin`    | `Number[3]`  | "Center" of tile geometry in WGS84 fixed frame coordinates                                                |
| `cartographicOrigin` | `Number[3]`  | "Origin" in lng/lat (center of tile's bounding volume)                                                    |
| `modelMatrix`        | `Number[16]` | Transforms tile geometry positions to fixed frame coordinates                                             |
| `vertexCount`        | `Number`     | Transforms tile geometry positions to fixed frame coordinates                                             |
| `attributes`         | `Object`     | Binary typed arrays containing the geometry of the tile.                                                  |
| `texture`            | `Object`     | Loaded texture by [`loaders.gl/image`](https://loaders.gl/modules/images/docs/api-reference/image-loader) |
| `featureData`        | `Object`     | Loaded feature data for parsing the geometies (Will be deprecated in 2.x)                                 |

`attributes` contains following fields

| Field                  | Type     | Contents                          |
| ---------------------- | -------- | --------------------------------- |
| `attributes.positions` | `Object` | `{value, type, size, normalized}` |
| `attributes.normals`   | `Object` | `{value, type, size, normalized}` |
| `attributes.colors`    | `Object` | `{value, type, size, normalized}` |
| `attributes.texCoords` | `Object` | `{value, type, size, normalized}` |

Each attribute follows luma.gl [accessor](https://github.com/visgl/luma.gl/blob/master/docs/api-reference/webgl/accessor.md) properties.
