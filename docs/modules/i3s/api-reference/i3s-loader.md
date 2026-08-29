---
title: I3SLoader
description: Load Indexed 3D Scene layers and their node resources.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';
import {TiledSceneGraphic} from '@site/src/components/docs/tiled-scene-graphic';

<DocPageHeader
  eyebrow="I3S loader"
  title="Load ArcGIS scene layers as traversable data."
  description="`I3SLoader` reads Indexed 3D Scene layers, their geometry and texture resources, and the metadata needed by the shared tiles runtime. Use it for mesh, point, and scene-layer content delivered as JSON, binary nodes, or an SLPK archive."
  tone="orange"
  meta={['I3S 1.x and 2.x', 'Scene and point layers', 'JSON and binary resources']}
  links={[
    {label: 'I3S module', to: '/docs/modules/i3s'},
    {label: 'I3S format', to: '/docs/modules/i3s/formats/i3s'},
    {label: 'I3S source', to: '/docs/modules/tiles/api-reference/i3s-source'}
  ]}
/>

<TiledSceneGraphic />

<DocOrientation
  eyebrow="The I3S loading path"
  title="Read layer metadata, traverse nodes, decode payloads."
  description="I3S is a layered delivery format rather than one self-contained file. The loader keeps the format-specific details behind the normal loaders.gl and tiles APIs."
  tone="orange"
  items={[
    {label: 'Input', value: 'Layer JSON, node resources, or an SLPK archive'},
    {label: 'Hierarchy', value: 'Scene layer nodes with level-of-detail metadata'},
    {label: 'Payloads', value: 'Mesh, point, texture, material, and attribute resources'},
    {label: 'Output', value: 'I3S data for loaders, sources, and tiles traversal'}
  ]}
/>

<p className="badges">
  <img src="https://img.shields.io/badge/From-v2.1-blue.svg?style=flat-square" alt="From-v2.1" />
</p>

A loader for loading an [Indexed 3d Scene (I3S) layer](https://github.com/Esri/i3s-spec), and its geometries and textures data.

:::info[Choose the entry point]

- Use `I3SLoader` with `load` or `parse` when the application needs a parsed layer, node, or tile
  payload.
- Use `I3SSource` with `Tileset3D` when the application needs hierarchy traversal, caching, and
  view-dependent loading.
- Use `SourceLayer` when a deck.gl application should connect an ArcGIS SceneServer URL directly to
  the shared 3D source layer.

The layer document is JSON, while node indexes, geometry, textures, and attributes are resolved as
separate resources. An I3S loader therefore describes a resource family rather than one file
extension.

:::

## Format support

<ReferenceBoundary
  title="Format and runtime details"
  description="The detailed sections cover supported I3S profiles, terminology, loading, rendering integration, and the full loader object."
  tone="orange"
/>

See the [I3S format support matrix](../formats/i3s) for detailed coverage of scene layer profiles,
specification generations, delivery modes, hierarchy and LOD, mesh geometry, textures, materials,
feature attributes, coordinate systems, conversion, and known gaps.

Point scene layers use the same `I3SLoader` and `I3SSource` path as mesh layers. Their content has
`topology: 'point-list'`; `pointRenderer` and `pointSymbol` retain the typed ArcGIS renderer
metadata, while `featureIds` align vertices with the standard node-local attribute resources.
Point Cloud layers remain available through the separate `I3SPointCloudSource` API.

## Terms

The terms and concepts used in `i3s` module have the corresponding parts [I3S Spec](https://github.com/Esri/i3s-spec/blob/master/format/Indexed%203d%20Scene%20Layer%20Format%20Specification.md).

- `tileset`: I3S Indexed 3D Layer File.
- `tile`: I3S node file.
- `tileContent`: I3S node content: geometries, textures, etc.

## Usage

As an I3S tileset contains multiple file formats, `I3SLoader` is needed to be explicitly specified when using [`load`](/docs/modules/core/api-reference/load).

### Render an I3S layer with deck.gl

`SourceLayer` selects the I3S source runtime and keeps hierarchy traversal separate from the
renderer. The same pattern works for SceneServer mesh and point layers:

```typescript
import {SourceLayer} from '@loaders.gl/deck-layers';
import {COORDINATE_SYSTEM, I3SLoader} from '@loaders.gl/i3s';

const layer = new SourceLayer({
  id: 'city-buildings',
  data: 'https://tiles.arcgis.com/tiles/z2tnIkrLQ2BRzr6P/arcgis/rest/services/SanFrancisco_Bldgs/SceneServer/layers/0',
  loaders: [I3SLoader],
  loadOptions: {
    i3s: {coordinateSystem: COORDINATE_SYSTEM.LNGLAT_OFFSETS}
  }
});
```

See the [I3S example](/examples/i3s-arcgis) for a complete application and the
[`I3SSource`](/docs/modules/tiles/api-reference/i3s-source) reference for direct traversal.

**Basic API Usage**

Basic API usage is illustrated in the following snippet. Create a `Tileset3D` instance, point it a valid tileset URL, set up callbacks, and keep feeding in new camera positions:

```typescript
import {I3SLoader} from '@loaders.gl/i3s';
import {I3SSource, Tileset3D} from '@loaders.gl/tiles';
import {WebMercatorViewport} from '@deck.gl/core';

const tilesetUrl =
  'https://tiles.arcgis.com/tiles/z2tnIkrLQ2BRzr6P/arcgis/rest/services/SanFrancisco_Bldgs/SceneServer/layers/0';

const source = new I3SSource({url: tilesetUrl, loader: I3SLoader});

const tileset = new Tileset3D(source, {
  onTileLoad: tile => console.log(tile)
});

const viewport = new WebMercatorViewport({
  width: 600,
  height: 400,
  latitude: 37.7749,
  longitude: -122.4194,
  zoom: 15
});
await tileset.selectTiles(viewport);

// Call again whenever the viewport changes (pan, zoom, and so on).
await tileset.selectTiles(viewport);

// Visible tiles
const visibleTiles = tileset.tiles.filter(tile => tile.selected);

// Note that visibleTiles will likely not immediately include all tiles.
// Content continues loading and onTileLoad fires as resources become ready.
```

## Options

| Option                              | Type             | Default | Description                                                                                                                                                                                                                                                                                                                     |
| ----------------------------------- | ---------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `options.i3s.isTileset`             | `boolean \| 'auto'` | `'auto'` | Treat the resource as a layer document instead of a node or content resource. Auto-detection follows I3S URL conventions. |
| `options.i3s.isTileHeader`          | `boolean \| 'auto'` | `'auto'` | Treat the resource as a node header. Auto-detection follows `/nodes/...` URL conventions. |
| `options.i3s.token`                 | `string` | — | ArcGIS access token appended to source-managed requests. |
| `options.i3s.useDracoGeometry`      | `boolean` | `true` | Decode Draco-compressed geometry when available. |
| `options.i3s.useCompressedTextures` | `boolean` | `true` | Use DDS or KTX2 resources when the runtime supports them. |
| `options.i3s.decodeTextures`        | `boolean` | `true` | Decode image resources into the returned texture representation. |
| `options.i3s.coordinateSystem`      | `CoordinateSystem` | `METER_OFFSETS` | Select the deck.gl-compatible output coordinate system for decoded content. |

## Data formats

Loaded data conforms to the 3D Tiles loader category specification with the following exceptions.

### Tileset Object

The following fields are guaranteed. Additionally, the loaded tileset object will contain all the data fetched from the provided url.

| Field            | Type     | Contents                                                                                                                                                                                                                                                                         |
| ---------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`           | `String` | Value is `i3s`. Indicates the returned object is an `i3s` tileset.                                                                                                                                                                                                               |
| `lodMetricType`  | `String` | Root's level of detail (LoD) metric type, which is used to decide if a tile is sufficient for current viewport. Only support `maxScreenThreshold` for now. Check I3S [lodSelection](https://github.com/Esri/i3s-spec/blob/master/docs/1.8/lodSelection.cmn.md) for more details. |
| `lodMetricValue` | `Number` | Root's level of detail (LoD) metric value.                                                                                                                                                                                                                                       |

### Tile Object

The following fields are guaranteed. Additionally, the loaded tile object will contain all the data fetched from the provided url.

| Field            | Type     | Contents                                                                                                                                                                                                                                                                                 |
| ---------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`             | `String` | Identifier of the tile, unique in a tileset                                                                                                                                                                                                                                              |
| `refine`         | `String` | Refinement type of the tile, currently only support `REPLACE`                                                                                                                                                                                                                            |
| `type`           | `String` | Type of the tile, value is `mesh` (currently only support [I3S MeshPyramids](https://github.com/Esri/i3s-spec)                                                                                                                                                                           |
| `url`            | `String` | The url of this tile.                                                                                                                                                                                                                                                                    |
| `contentUrl`     | `String` | The url of this tile.                                                                                                                                                                                                                                                                    |
| `featureUrl`     | `String` | The url of this tile.                                                                                                                                                                                                                                                                    |
| `textureUrl`     | `String` | The url of this tile.                                                                                                                                                                                                                                                                    |
| `textureUrls`    | `Object[]` | Selected URLs for every texture-set resource referenced by the tile material.                                                                                                                                                                                                          |
| `boundingVolume` | `Object` | A bounding volume in Cartesian coordinates converted from i3s node's [`mbs`](https://github.com/Esri/i3s-spec/blob/master/format/Indexed%203d%20Scene%20Layer%20Format%20Specification.md) that encloses a tile or its content. Exactly one box, region, or sphere property is required. |
| `lodMetricType`  | `String` | Level of Detail (LoD) metric type, which is used to decide if a tile is sufficient for current viewport. Only support `maxScreenThreshold` for now. Check I3S [lodSelection](https://github.com/Esri/i3s-spec/blob/master/docs/1.8/lodSelection.cmn.md) for more details.                |
| `lodMetricValue` | `String` | Level of Detail (LoD) metric value.                                                                                                                                                                                                                                                      |
| `content`        | `String` | The actual payload of the tile or the url point to the actual payload. If `option.loadContent` is enabled, content will be populated with the loaded value following the Tile Content section                                                                                            |

### Tile Content

After content is loaded, the following fields are guaranteed. But different tiles may have different extra content fields.

| Field                | Type         | Contents                                                                                                                              |
| -------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `cartesianOrigin`    | `Number[3]`  | "Center" of tile geometry in WGS84 fixed frame coordinates                                                                            |
| `cartographicOrigin` | `Number[3]`  | "Origin" in lng/lat (center of tile's bounding volume)                                                                                |
| `modelMatrix`        | `Number[16]` | Transforms tile geometry positions to fixed frame coordinates                                                                         |
| `vertexCount`        | `Number`     | Transforms tile geometry positions to fixed frame coordinates                                                                         |
| `attributes`         | `Object`     | Each attribute follows luma.gl [accessor](https://github.com/visgl/luma.gl/blob/master/docs/api-reference/webgl/README.md) properties |
| `texture`            | `Object`     | Loaded texture by [`loaders.gl/image`](/docs/modules/images/api-reference/image-loader)                                               |
| `textures`           | `Object`     | Loaded texture-set resources keyed by texture-set definition id.                                                                       |
| `featureData`        | `Object`     | Loaded feature data for parsing the geometies (Will be deprecated in 2.x)                                                             |

`attributes` contains following fields

| Field                  | Type     | Contents                          |
| ---------------------- | -------- | --------------------------------- |
| `attributes.positions` | `Object` | `{value, type, size, normalized}` |
| `attributes.normals`   | `Object` | `{value, type, size, normalized}` |
| `attributes.colors`    | `Object` | `{value, type, size, normalized}` |
| `attributes.texCoords` | `Object` | `{value, type, size, normalized}` |

### Layer statistics

Use `loadStatistics` to fetch the resources listed in a scene layer's `statisticsInfo` array.
The returned object is keyed by each descriptor's `key`; an unavailable resource is represented by
`null` so other fields can still be consumed.

```typescript
import {loadStatistics} from '@loaders.gl/i3s';

const statistics = await loadStatistics(sceneLayer.statisticsInfo, {
  core: {baseUrl: sceneLayer.url},
  i3s: {token}
});
```

Set `core.baseUrl` to the loaded layer URL when descriptors use relative `href` values.
