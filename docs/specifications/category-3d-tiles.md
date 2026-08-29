---
title: 3D Tiles category
description: Load hierarchical worlds and point-cloud datasets through one tileset data model.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Loader category"
  title="Tiled worlds, loaded a piece at a time."
  description="The 3D Tiles category gives applications a common way to discover, select, cache, and refresh content from hierarchical 3D datasets. The source format can be 3D Tiles, I3S, or Potree."
  tone="violet"
  links={[
    {label: '3D data formats', to: '/docs/developer-guide/3d-data-formats'},
    {label: '3D Tiles format', to: '/docs/modules/3d-tiles/formats/3d-tiles'}
  ]}
/>

<DocOrientation
  eyebrow="What the category standardizes"
  title="The application follows the visible world, not the file layout."
  description="A tileset exposes hierarchy, bounds, geometric error, and content references. Traversal code decides what belongs in view while format adapters handle the source-specific details."
  tone="violet"
  items={[
    {label: 'Sources', value: '3D Tiles, I3S, and Potree datasets'},
    {label: 'Selection', value: 'Bounds, screen-space error, and level of detail'},
    {label: 'Runtime', value: 'Caching, scheduling, cancellation, and refresh'},
    {label: 'Payloads', value: 'glTF, point clouds, terrain, and application data'}
  ]}
/>

The 3D Tiles category defines a generalized representation of hierarchical geospatial data
structures. Specific loaders for tiled 3D data return a standardized representation.

The 3D Tiles category can represent the major tiled 3D formats:

- [OGC 3D Tiles](https://www.opengeospatial.org/standards/3DTiles) standard
- [OGC I3S](https://www.opengeospatial.org/standards/i3s) standard
- [Potree](https://potree.github.io/) format

| Loader                                                                      | Notes |
| --------------------------------------------------------------------------- | ----- |
| [`Tiles3DLoader`](/docs/modules/3d-tiles/api-reference/tiles-3d-loader)     |       |
| [`CesiumIonLoader`](/docs/modules/3d-tiles/api-reference/cesium-ion-loader) |       |
| [`I3SLoader`](/docs/modules/i3s/api-reference/i3s-loader)                   |       |
| [`PotreeLoader`](/docs/modules/potree/api-reference/potree-loader)          |       |

<ReferenceBoundary
  title="The tileset contract"
  description="The sections below describe the shared tile representation, traversal lifecycle, coordinate systems, and helper classes."
  tone="violet"
/>

## Concepts

- **Tile header hierarchy** - A minimal listing of available tiles that lets an application decide
  which parts of the hierarchy matter for the current view.
- **Tile header** - A tile's bounds, screen-space error, refinement mode, and content reference.
- **Tile cache** - A bounded store for content that is no longer visible but may be needed again.
- **Tileset traversal** - View-dependent loading and selection that requests new tiles and releases
  older content as the camera moves.

## Helper Classes

The `@loaders.gl/tiles` module provides classes that facilitate working with `3D Tiles` loader category data.

### Tileset traversal

Once a top-level tileset file is loaded, an application can instantiate `Tileset3D` and call
`tileset3D.update(viewport)` as the camera changes.

3D tiled datasets tend to be large, so traversal loads only the tiles needed for the current view.

`Tileset3D` accepts `onTileLoad` and `onTileUnload` callbacks that notify the application when
the set of renderable tiles changes. Tile loads complete asynchronously, after
`tileset3D.update(...)` returns.

### Coordinate systems

To help applications process tile positions, 3D Tiles category loaders provide matrices that
support both fixed-frame and cartographic (longitude/latitude-relative, east-north-up / ENU)
coordinate systems:

- _cartesian_ WGS84 fixed frame coordinates
- _cartographic_ tile geometry positions to ENU meter offsets from `cartographicOrigin`.

Position units in both cases are in meters.

For cartographic coordinates, tiles include a pre-chosen cartographic origin and a precalculated
model matrix. The origin is selected from the tile's bounding-volume center; applications can
choose a different origin and calculate a transform, for example with math.gl's `Ellipsoid`
class.

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

Tiles may be loaded in bulk, by pages, or one tile at a time, depending on the source format.

| Field            | Type     | Contents                                                                                                                                                                                                                                                                  |
| ---------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`           | `string` | E.g. `mesh`.                                                                                                                                                                                                                                                              |
| `id`             | `string` | Identifier of the tile, unique in a tileset                                                                                                                                                                                                                               |
| `refine`         | `string` | Refinement type of the tile `ADD` or `REPLACE`                                                                                                                                                                                                                            |
| `url`            | `string` | The url of this tile.                                                                                                                                                                                                                                                     |
| `contentUrl`     | `string` | The url of this tile.                                                                                                                                                                                                                                                     |
| `featureUrl`     | `string` | The url of this tile.                                                                                                                                                                                                                                                     |
| `textureUrl`     | `string` | The url of this tile.                                                                                                                                                                                                                                                     |
| `boundingVolume` | `Object` | A bounding volume in Cartesian coordinates converted from i3s node's [`mbs`](https://github.com/Esri/i3s-spec/blob/master/docs/1.6/mbs.cmn.) that encloses a tile or its content. Exactly one box, region, or sphere property is required.                                |
| `lodMetricType`  | `string` | Level of Detail (LoD) metric type, which is used to decide if a tile is sufficient for current viewport. Only support `maxScreenThreshold` for now. Check I3S [lodSelection](https://github.com/Esri/i3s-spec/blob/master/docs/1.7/lodSelection.cmn.md) for more details. |
| `lodMetricValue` | `string` | Level of Detail (LoD) metric value.                                                                                                                                                                                                                                       |
| `children`       | `Array`  | An array of child tile objects. Child content is enclosed by the parent bounding volume and generally has more detail. Leaf tiles have no children. |
| `content`        | `string` | The tile payload or a URL pointing to it. If `options.loadContent` is enabled, this field contains the loaded value described in the Tile Content section. |

### Tile Content

After content is loaded, the following fields are guaranteed. But different tiles may have different extra content fields.

| Field                | Type         | Contents                                                                                                  |
| -------------------- | ------------ | --------------------------------------------------------------------------------------------------------- |
| `cartesianOrigin`    | `Number[3]`  | "Center" of tile geometry in WGS84 fixed frame coordinates                                                |
| `cartographicOrigin` | `Number[3]`  | "Origin" in lng/lat (center of tile's bounding volume)                                                    |
| `modelMatrix`        | `Number[16]` | Transforms tile geometry positions to fixed frame coordinates                                             |
| `vertexCount`        | `Number`     | Number of vertices in the tile geometry                                                                     |
| `attributes`         | `Object`     | Binary typed arrays containing the geometry of the tile.                                                  |
| `texture`            | `Object`     | Loaded texture by [`loaders.gl/image`](https://loaders.gl/docs/modules/images/api-reference/image-loader) |
| `featureData`        | `Object`     | Loaded feature data used when parsing tile geometry (legacy field)                                         |

`attributes` contains following fields

| Field                  | Type     | Contents                          |
| ---------------------- | -------- | --------------------------------- |
| `attributes.positions` | `Object` | `{value, type, size, normalized}` |
| `attributes.normals`   | `Object` | `{value, type, size, normalized}` |
| `attributes.colors`    | `Object` | `{value, type, size, normalized}` |
| `attributes.texCoords` | `Object` | `{value, type, size, normalized}` |

Each attribute follows luma.gl [accessor](https://github.com/visgl/luma.gl/blob/master/docs/api-reference/webgl/README.md) properties.
