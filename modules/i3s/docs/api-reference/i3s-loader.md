# I3SLoader

> The `I3SLoader` is experimental. Currently only support I3S `MeshPyramids` data format.

A loader for loading an [Indexed 3d Scene (I3S) layer](https://github.com/Esri/i3s-spec), and its geometries and textures data.

| Loader         | Characteristic                                      |
| -------------- | --------------------------------------------------- |
| File Format    | [I3S Layer](https://github.com/Esri/i3s-spec)       |
| File Type      | Json, Binary                                        |
| File Extension | `.json` (layer), `.bin` (geometries)                |
| File Format    | [i3s](https://www.opengeospatial.org/standards/i3s) |
| Data Format    | [Data formats](#data-formats)                       |
| Supported APIs | `load`, `parse`                                     |

## Terms

The terms and concepts used in `i3s` module have the corresponding parts [I3S Spec](https://github.com/Esri/i3s-spec/blob/master/format/Indexed%203d%20Scene%20Layer%20Format%20Specification.md).

- `tileset`: I3S Indexed 3D Layer File.
- `tile`: I3S node file.
- `tileContent`: I3S node content: geometries, textures, etc.

## Usage

When using loaders.gl's generic [`load`](https://loaders.gl/modules/core/docs/api-reference/load#load) function, user needs explicitly specify `I3Sloader` as auto detect loader from previously [`registered loaders`](https://loaders.gl/modules/core/docs/api-reference/register-loaders) is currently not supported for`I3Sloader`.

```js
import {I3SLoader} from '@loaders.gl/i3s';
import {load} from '@loaders.gl/core';

// load tileset
const tileseturl =
  'https://tiles.arcgis.com/tiles/z2tnIkrLQ2BRzr6P/arcgis/rest/services/SanFrancisco_Bldgs/SceneServer/layers/0';
const tileset = await load(tileseturl, I3SLoader, {token: '<token-to-fetch-data>'});

// load tile with content
const tileUrl =
  'https://tiles.arcgis.com/tiles/z2tnIkrLQ2BRzr6P/arcgis/rest/services/SanFrancisco_Bldgs/SceneServer/layers/0/nodes/2';
const tile = await load(tileUrl, I3SLoader, {i3s: {loadContent: true}});

// load tile content
// featureUrl is needed to load the tile content
const tileUrl =
  'https://tiles.arcgis.com/tiles/z2tnIkrLQ2BRzr6P/arcgis/rest/services/SanFrancisco_Bldgs/SceneServer/layers/0/nodes/2/geometries/0';
await load(tileUrl, I3SLoader, {tile});
// load to `tile.content`
```

## Options

| Option                     | Type             | Default | Description                                                                                                                                                                                                                                                                                                                     |
| -------------------------- | ---------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `options.i3s.isTileset`    | `Bool` or `null` | `null`  | Whether to load `Tileset` (Layer 3D Index) file. If not specifies, will decide if follow `ArcGIS` tile layers' url convention                                                                                                                                                                                                   |
| `options.i3s.isTileHeader` | `Bool` or `null` | `null`  | Whether to load `TileHeader`(node) file. If not specifies, will decide if follow `argis` url convention                                                                                                                                                                                                                         |
| `options.i3s.loadContent`  | `Bool`           | `true`  | Whether to load tile content (geometries, texture, etc.). Note: I3S dataset, each tile node has separate urls pointing to tile metadata and its actual tile payload. If `loadContent` is true, i3s loader will make a request to fetch the content fiile and decoded to the format as specified in [Tile Object](#tile-object). |
| `options.i3s.tileset`      | `Object`         | `null`  | `Tileset` object loaded by I3SLoader or follow the data format specified in [Tileset Object](#tileset-object). It is required when loading i3s geometry content                                                                                                                                                                 |
| `options.i3s.tile`         | `Object`         | `null`  | `Tile` object loaded by I3SLoader or follow the data format [Tile Object](#tile-object). It is required when loading i3s geometry content                                                                                                                                                                                       |

## Data formats

This section specifies the loaded data formats.

### Tileset Object

The following fields are guaranteed. Additionally, the loaded tileset object will contain all the data fetched from the provided url.

| Field            | Type     | Contents                                                                                                                                                                                                                                                                         |
| ---------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `loader`         | `Object` | I3SLoader                                                                                                                                                                                                                                                                        |
| `root`           | `Object` | The root tile header object                                                                                                                                                                                                                                                      |
| `url`            | `String` | The url of this tileset                                                                                                                                                                                                                                                          |
| `type`           | `String` | Value is `i3s`. Indicates the returned object is an `i3s` tileset.                                                                                                                                                                                                               |
| `lodMetricType`  | `String` | Root's level of detail (LoD) metric type, which is used to decide if a tile is sufficient for current viewport. Only support `maxScreenThreshold` for now. Check I3S [lodSelection](https://github.com/Esri/i3s-spec/blob/master/docs/1.7/lodSelection.cmn.md) for more details. |
| `lodMetricValue` | `Number` | Root's level of detail (LoD) metric value.                                                                                                                                                                                                                                       |

### Tile Object

The following fields are guaranteed. Additionally, the loaded tile object will contain all the data fetched from the provided url.

| Field            | Type     | Contents                                                                                                                                                                                                                                                                                 |
| ---------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `url`            | `String` | The url of this tile.                                                                                                                                                                                                                                                                    |
| `contentUrl`     | `String` | The url of this tile.                                                                                                                                                                                                                                                                    |
| `featureUrl`     | `String` | The url of this tile.                                                                                                                                                                                                                                                                    |
| `textureUrl`     | `String` | The url of this tile.                                                                                                                                                                                                                                                                    |
| `boundingVolume` | `Object` | A bounding volume in Cartesian coordinates converted from i3s node's [`mbs`](https://github.com/Esri/i3s-spec/blob/master/format/Indexed%203d%20Scene%20Layer%20Format%20Specification.md) that encloses a tile or its content. Exactly one box, region, or sphere property is required. |
| `lodMetricType`  | `String` | Level of Detail (LoD) metric type, which is used to decide if a tile is sufficient for current viewport. Only support `maxScreenThreshold` for now. Check I3S [lodSelection](https://github.com/Esri/i3s-spec/blob/master/docs/1.7/lodSelection.cmn.md) for more details.                |
| `lodMetricValue` | `String` | Level of Detail (LoD) metric value.                                                                                                                                                                                                                                                      |
| `children`       | `Array`  | An array of objects that define child tiles. Each child tile content is fully enclosed by its parent tile's bounding volume and, generally, has more details than parent. for leaf tiles, the length of this array is zero, and children may not be defined.                             |
| `content`        | `String` | The actual payload of the tile or the url point to the actual payload. If `option.loadContent` is enabled, content will be populated with the loaded value following the Tile Content section                                                                                            |
| `id`             | `String` | Identifier of the tile, unique in a tileset                                                                                                                                                                                                                                              |
| `refine`         | `String` | Refinement type of the tile, currently only support `REPLACE`                                                                                                                                                                                                                            |
| `type`           | `String` | Type of the tile, value is `mesh` (currently only support [I3S MeshPyramids](https://github.com/Esri/i3s-spec)                                                                                                                                                                           |

### Tile Content

After content is loaded, the following fields are guaranteed. But different tiles may have different extra content fields.

| Field                | Type         | Contents                                                                                                                               |
| -------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `cartesianOrigin`    | `Number[3]`  | "Center" of tile geometry in WGS84 fixed frame coordinates                                                                             |
| `cartographicOrigin` | `Number[3]`  | "Origin" in lng/lat (center of tile's bounding volume)                                                                                 |
| `modelMatrix`        | `Number[16]` | Transforms tile geometry positions to fixed frame coordinates                                                                          |
| `vertexCount`        | `Number`     | Transforms tile geometry positions to fixed frame coordinates                                                                          |
| `attributes`         | `Object`     | Each attribute follows luma.gl [accessor](https://github.com/uber/luma.gl/blob/master/docs/api-reference/webgl/accessor.md) properties |
| `texture`            | `Object`     | Loaded texture by [`loaders.gl/image`](https://loaders.gl/modules/images/docs/api-reference/image-loader)                              |
| `featureData`        | `Object`     | Loaded feature data for parsing the geometies (Will be deprecated in 2.x)                                                              |

`attributes` contains following fields

| Field                  | Type     | Contents                          |
| ---------------------- | -------- | --------------------------------- |
| `attributes.positions` | `Object` | `{value, type, size, normalized}` |
| `attributes.normals`   | `Object` | `{value, type, size, normalized}` |
| `attributes.colors`    | `Object` | `{value, type, size, normalized}` |
| `attributes.texCoords` | `Object` | `{value, type, size, normalized}` |
