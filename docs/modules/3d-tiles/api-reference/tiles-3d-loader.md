---
title: Tiles3DLoader
description: Parse 3D Tiles tilesets and tile payloads with linked assets.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="3D Tiles loader"
  title="Read tiled 3D worlds one payload at a time."
  description="`Tiles3DLoader` parses 3D Tiles tilesets and their renderable content, then delegates linked glTF, Draco, image, and texture payloads to the appropriate loaders. Use it directly for parsing or with `Tiles3DSource` for view-driven traversal."
  tone="blue"
  meta={['3D Tiles', 'Linked asset loading', 'Tileset and tile content']}
  links={[
    {label: '3D Tiles module', to: '/docs/modules/3d-tiles'},
    {label: '3D Tiles format', to: '/docs/modules/3d-tiles/formats/3d-tiles'},
    {label: 'Tiles source', to: '/docs/modules/tiles/api-reference/tiles-3d-source'}
  ]}
/>

<DocOrientation
  eyebrow="The 3D Tiles path"
  title="Read the tileset. Resolve content. Decode the renderable payload."
  description="A 3D Tiles dataset is a hierarchy plus content resources. The loader handles the format boundary; the tiles runtime decides which content should be requested for a view."
  tone="blue"
  items={[
    {label: 'Input', value: 'Tileset JSON or binary tile content'},
    {label: 'Hierarchy', value: 'Tiles, bounding volumes, and refinement'},
    {label: 'Subloaders', value: 'glTF, Draco, images, and textures'},
    {label: 'Output', value: 'Tileset metadata or decoded tile content'}
  ]}
/>

<p class="badges">
  <img src="https://img.shields.io/badge/From-v2.1-blue.svg?style=flat-square" alt="From-v2.1" />
</p>

Parses a [3D tiles](https://github.com/AnalyticalGraphicsInc/3d-tiles) tileset.

| Loader                | Characteristic                                                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| File Extensions       | `.b3dm`,`.i3dm`, `.pnts`, `.cmpt`                                                                                        |
| File Type             | Binary (with linked assets)                                                                                              |
| File Format           | [3D Tiles](https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/specification#tile-format-specifications)       |
| Data Format           | Data Formats (see below)                                                                                                 |
| Decoder Type          | Asynchronous                                                                                                             |
| Worker Thread Support | No                                                                                                                       |
| Streaming Support     | No \*                                                                                                                    |
| Subloaders            | `DracoLoader` (`.pnts`), `GLTFLoader` (`.b3dm`, `.i3dm`), `ImageBitmapLoader` (`.jpg`, `.png`), `TextureLoader` (`.ktx`) |

\* Streaming is not supported for individual tiles, however tilesets are streamed by loading only the tiles needed for the specified viewports.

## Usage

<ReferenceBoundary
  title="Loader and payload details"
  description="The reference below covers direct parsing, tileset traversal, validation, options, linked assets, and supported content types."
  tone="blue"
/>

As a tileset contains multiple file formats, `Tiles3DLoader` is needed to be explicitly specified when using [`load`](https://loaders.gl/modules/core/docs/api-reference/load) function.

Load a tileset file.

```typescript
import {load} from '@loaders.gl/core';
import {Tiles3DLoader} from '@loaders.gl/3d-tiles';
const tilesetUrl = 'https://assets.ion.cesium.com/43978/tileset.json';
const tilesetJson = await load(tilesetUrl, Tiles3DLoader);
```

To decompress tiles containing Draco compressed glTF models or Draco compressed point clouds:

```typescript
import {load} from '@loaders.gl/core';
import {Tiles3DLoader} from '@loaders.gl/3d-tiles';
const tileUrl = 'https://assets.ion.cesium.com/43978/1.pnts';
const tile = await load(tileUrl, Tiles3DLoader, {decompress: true});
```

Load a tileset and dynamically load/unload tiles based on viewport with helper class `Tileset3D` (`@loaders.gl/tiles`)

```typescript
import {load} from '@loaders.gl/core';
import {Tileset3D} from '@loaders.gl/tiles';
import {Tiles3DLoader} from '@loaders.gl/3d-tiles';
import {WebMercatorViewport} from '@deck.gl/core';

const tilesetUrl = 'https://assets.cesium.ion.com/43978/tileset.json';
const tilesetHeader = await load(tilesetUrl, Tiles3DLoader);

const tileset = new Tileset3D(tilesetHeader, {
  throttleRequests: false,
  onTileLoad: (tile) => console.log(tile)
});

const viewport = new WebMercatorViewport({
  width: 600,
  height: 400,
  latitude: 40.7067584,
  longitude: -74.0115413,
  zoom: 17
});
await tileset.selectTiles(viewport);

// visible tiles
const visibleTiles = tileset.tiles.filter((tile) => tile.selected);
// Note that visibleTiles will likely not immediately include all tiles
// tiles will keep loading and file `onTileLoad` callbacks

// To fully load all tiles in a given view, repeatedly select tiles until the tileset is loaded
while (!tileset.isLoaded()) {
  await tileset.selectTiles(viewport);
}
```

## Tileset Metadata Validation

`Tiles3DLoader` validates raw tileset JSON before normalizing the header or loading tile content.
Applications can use the same Zod schema directly:

```typescript
import {Tiles3DTilesetSchema} from '@loaders.gl/3d-tiles/tileset-zod-schema';

const validatedTileset = Tiles3DTilesetSchema.parse(tilesetJson);
```

The equivalent generated JSON Schema is published as
`@loaders.gl/3d-tiles/tileset.schema.json` for editors, build tools, and non-TypeScript validators.
Both schemas enforce the same structural constraints, including that a tileset cannot define both
`schema` and `schemaUri`.

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `3d-tiles.isTileset` | `boolean \| 'auto'` | `'auto'` | Select tileset-header or render-content parsing. Auto-detection uses binary magic and JSON structure rather than trusting the URL extension. |
| `3d-tiles.loadGLTF` | `boolean` | `true` | Parse embedded glTF binaries and linked glTF resources in `b3dm` and `i3dm` content. |
| `3d-tiles.decodeQuantizedPositions` | `boolean` | `false` | Decode quantized point positions on the CPU when the renderer does not handle them directly. |
| `3d-tiles.maximumCachedSubtrees` | `number` | `32` | Limit settled implicit-subtree resources retained by each 3D Tiles source. `0` retains only in-flight requests for deduplication. |
| `3d-tiles.assetGltfUpAxis` | `'x' \| 'y' \| 'z' \| null` | `null` | Override the up axis used when interpreting linked glTF assets. |

General request options such as headers are supplied through the shared loaders.gl options. When
`3d-tiles.loadGLTF` is enabled, use [`GLTFLoader` options](/docs/modules/gltf/api-reference/gltf-loader)
under `options.gltf` to control linked scene resources.

Standard linked raster images are decoded through [`ImageBitmapLoader`](/docs/modules/images/api-reference/image-bitmap-loader).

See [Resource resolution and content detection](/docs/modules/3d-tiles/concepts/resource-resolution-and-content-detection) for extensionless and signed URLs, nested tilesets, inherited query parameters, archive sources, validation behavior, and troubleshooting.

## Notes about Tile Types

### b3dm, i3dm

The Batched 3D Model and Instanced 3D Model tile types contain an embedded glTF file. This can be
parsed into a hierarchical scene graph description that can be used to instantiate an actual scene
graph in most WebGL libraries.

Can load both binary `.glb` files and JSON `.gltf` files.

### glTF content extension

[3DTILES_content_gltf](https://github.com/CesiumGS/3d-tiles/tree/main/extensions/3DTILES_content_gltf) extension is supported. This extension allows a tileset to use glTF 2.0 assets directly as tile content. Both glTF JSON and GLB binary formats are supported.

## Data Format

Loaded data conforms to the 3D Tiles loader category specification with the following exceptions.

### Tileset Object

| Field            | Type     | Contents                                                                                                                                                                                                                                                                                                                   |
| ---------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`           | `String` | Value is `TILES3D`. Indicates the returned object is a Cesium `3D Tiles` tileset.                                                                                                                                                                                                                                          |
| `lodMetricType`  | `String` | Root's Level of Detail (LoD) metric type, which is used to decide if a tile is sufficient for current viewport. Used for deciding if this tile is sufficient given current viewport. Cesium use [`geometricError`](https://github.com/AnalyticalGraphicsInc/3d-tiles/blob/master/specification/README.md#geometric-error). |
| `lodMetricValue` | `Number` | Root's level of detail (LoD) metric value.                                                                                                                                                                                                                                                                                 |

### Tile Object

The following fields are guaranteed. Additionally, the loaded tile object will contain all the data fetched from the provided url.

| Field             | Type         | Contents                                                                                                                                                                                                                                                                                                            |
| ----------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`              | `String`     | Identifier of the tile, unique in a tileset                                                                                                                                                                                                                                                                         |
| `refine`          | `String`     | Refinement type of the tile, `ADD` or `REPLACE`                                                                                                                                                                                                                                                                     |
| `type`            | `String`     | Type of the tile, one of `pointcloud` (`.pnts`), `scenegraph` (`.i3dm`, `.b3dm`, `.glb`, `.gltf`)                                                                                                                                                                                                                   |
| `boundingVolume`  | `Object`     | A bounding volume in Cartesian coordinates that encloses a tile or its content. Exactly one box, region, or sphere property is required. ([`Reference`](https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/specification#bounding-volume))                                                               |
| `lodMetricType`   | `String`     | Level of Detail (LoD) metric type, which is used to decide if a tile is sufficient for current viewport. Used for deciding if this tile is sufficient given current viewport. Cesium use [`geometricError`](https://github.com/AnalyticalGraphicsInc/3d-tiles/blob/master/specification/README.md#geometric-error). |
| `lodMetricValue`  | `String`     | Level of Detail (LoD) metric value.                                                                                                                                                                                                                                                                                 |
| `children`        | `Array`      | An array of objects that define child tiles. Each child tile content is fully enclosed by its parent tile's bounding volume and, generally, has more details than parent. for leaf tiles, the length of this array is zero, and children may not be defined.                                                        |
| `transformMatrix` | `Number[16]` | A matrix that transforms from the tile's local coordinate system to the parent tile's coordinate system—or the tileset's coordinate system in the case of the root tile                                                                                                                                             |

### Tile Content

After content is loaded, the following fields are guaranteed. But different tiles may have different extra content fields.

| Field                | Type          | Contents                                                                                                                             |
| -------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `cartesianOrigin`    | `Number[3]`   | "Center" of tile geometry in WGS84 fixed frame coordinates                                                                           |
| `cartographicOrigin` | `Number[3]`   | "Origin" in lng/lat (center of tile's bounding volume)                                                                               |
| `modelMatrix`        | `Number[16]`  | Transforms tile geometry positions to fixed frame coordinates                                                                        |
| `attributes`         | `Object`      | Each attribute follows luma.gl [accessor](https://github.com/visgl/luma.gl/blob/master/docs/api-reference/webgl/accessor) properties |
| `featureIds`         | `Uint32Array` | An array of feature ids which specify which feature each vertex belongs to. Can be used for picking functionality.                   |

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
