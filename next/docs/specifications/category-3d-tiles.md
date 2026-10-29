Loader category

# Tiled worlds, loaded a piece at a time.

The 3D Tiles category gives applications a common way to discover, select, cache, and refresh content from hierarchical 3D datasets. The source format can be 3D Tiles, I3S, or Potree.

[3D data formats](https://loaders.gl/next/docs/developer-guide/3d-data-formats.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/3d-data-formats.md)[3D Tiles format](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/formats/3d-tiles.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/formats/3d-tiles.md)

Category data

### Load many formats into one application path.

Category data lets related loaders return compatible structures, so rendering, analysis, and export code can be shared.

MeshTableGISImageJSONScenegraph3D Tiles

Arrow TablePlain

Decode

[Tiles3D​Loader↗](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/api-reference/tiles-3d-loader.md)[Cesium​Ion​Loader↗](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/api-reference/cesium-ion-loader.md)[I3S​Loader↗](https://loaders.gl/next/docs/modules/tiles-3d/i3s/api-reference/i3s-loader.md)[Potree​Loader↗](https://loaders.gl/next/docs/modules/tiles-3d/potree/api-reference/potree-loader.md)

Data

[3D Tiles category dataTilesets / tiles↗](https://loaders.gl/next/docs/specifications/category-3d-tiles.md)

Encode

[Tiles3D​Writer↗](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/api-reference/tile-3d-writer.md)

View-dependent delivery

## A hierarchy turns one scene into useful requests.

Tiled formats keep spatial structure and level-of-detail metadata alongside their payloads. A runtime can select visible leaves instead of downloading the complete world.

Dataset hierarchy

root · world boundscoarse content and children

region westgeometric error

region eastgeometric error

leaf · L06leaf · L07leaf · L06leaf · L08

selec&#x74;**→**

Current view

viewport + error budget

boundsSSEpriority

selected contentFetch only the leaves that can contribute to this view.

glTFpointstextures

[Tileset3D traversal ↗](https://loaders.gl/next/docs/modules/tiles-3d/api-reference/tileset-3d.md)

3D Tiles and I3S differ in their resource layouts, but the application-facing idea is the same: preserve the hierarchy, select by view, and request content progressively.

What the category standardizes

## The application follows the visible world, not the file layout.

A tileset exposes hierarchy, bounds, geometric error, and content references. Traversal code decides what belongs in view while format adapters handle the source-specific details.

01

Sources

3D Tiles, I3S, and Potree datasets

02

Selection

Bounds, screen-space error, and level of detail

03

Runtime

Caching, scheduling, cancellation, and refresh

04

Payloads

glTF, point clouds, terrain, and application data

Choose the runtime that matches the job

* Use a format loader such as `Tiles3DLoader`, `I3SLoader`, or `PotreeLoader` when you need to inspect or load one resource.
* Use a source such as `Tiles3DSource` or `I3SSource` with `Tileset3D` when visibility, caching, request scheduling, and repeated viewport updates are part of the application.
* Use `SourceLayer` when a deck.gl application should connect a source directly to a renderer.

Detailed guide

## The tileset contract

The sections below describe the shared tile representation, traversal lifecycle, coordinate systems, and helper classes.

## Concepts[​](#concepts "Direct link to Concepts")

* **Tileset metadata** describes the source, coordinate context, and root of a hierarchy.
* **Tile headers** describe bounds, refinement, level of detail, child relationships, and content references.
* **Tile content** is the decoded application data for a selected tile.
* **Traversal** selects useful content for a viewport and manages requests, cache state, and release.

The category is intentionally format-neutral. A 3D Tiles source can use geometric error, while an I3S source can use its own level-of-detail metric; both expose the result through the same runtime selection model.

## Loader and runtime choices[​](#loader-and-runtime-choices "Direct link to Loader and runtime choices")

Use a loader when the application needs to parse one resource. Use a source-backed runtime when the application needs repeated, viewport-driven requests:

| Need                      | Entry point                                                                                                         | Role                                              |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Parse a 3D Tiles resource | [`Tiles3DLoader`](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/api-reference/tiles-3d-loader.md)     | Decode a tileset or tile payload                  |
| Resolve Cesium ion data   | [`CesiumIonLoader`](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/api-reference/cesium-ion-loader.md) | Resolve ion credentials and tileset URLs          |
| Parse I3S resources       | [`I3SLoader`](https://loaders.gl/next/docs/modules/tiles-3d/i3s/api-reference/i3s-loader.md)                   | Decode I3S metadata, nodes, and content           |
| Parse Potree resources    | [`PotreeLoader`](https://loaders.gl/next/docs/modules/tiles-3d/potree/api-reference/potree-loader.md)          | Decode Potree hierarchy and point data            |
| Traverse a tiled world    | [`Tileset3D`](https://loaders.gl/next/docs/modules/tiles-3d/api-reference/tileset-3d.md)                       | Select, request, cache, and release visible tiles |

Detailed guide

## The application-facing contract

The tables below summarize the common shape. Follow the source and runtime references for format-specific fields, options, and lifecycle details.

## Traversal[​](#traversal "Direct link to Traversal")

Create the format-specific source, give it to `Tileset3D`, and await selection as the viewport changes:

```
import {Tiles3DLoader} from '@loaders.gl/tiles-3d/3d-tiles';

import {Tiles3DSource, Tileset3D} from '@loaders.gl/tiles-3d';



const source = new Tiles3DSource({

  url: 'https://example.com/tileset.json',

  loader: Tiles3DLoader

});

const tileset = new Tileset3D(source);



await tileset.selectTiles(viewport);

const selectedTiles = tileset.selectedTiles;
```

`selectTiles` waits for initialization and coalesces repeated viewport updates. Content may continue arriving through the tile lifecycle after a selection pass. Use `onTileLoad` and `onTileUnload` when the renderer needs to react to those changes. `update(viewport)` remains available as a fire-and-forget compatibility wrapper.

For direct deck.gl integration, use [`SourceLayer`](https://loaders.gl/next/docs/developer-guide/using-sources.md) with the source and format loaders. See [Using sources](https://loaders.gl/next/docs/developer-guide/using-sources.md) for the renderer boundary.

## Application data[​](#application-data "Direct link to Application data")

The following fields are common entry points, but a source may add format-specific metadata. Use the [`Tile3D` reference](https://loaders.gl/next/docs/modules/tiles-3d/api-reference/tile-3d.md) for runtime state and the [3D Tiles format page](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/formats/3d-tiles.md) for payload conformance.

| Object              | Common fields                                                        | Meaning                                                        |
| ------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------- |
| Tileset             | `type`, `url`, `root`                                                | Source identity and the root tile header                       |
| Tile header         | `id`, `type`, `boundingVolume`, `children`, `content`                | Hierarchy, bounds, refinement inputs, and payload reference    |
| Tile content        | `modelMatrix`, `cartesianOrigin`, `cartographicOrigin`, `attributes` | Decoded data plus the transforms needed to place it            |
| Point-cloud content | `pointCount`, `attributes.positions`, `attributes.colors`            | Point count and render-ready point attributes when supplied    |
| Scenegraph content  | `gltf`                                                               | Decoded glTF scene data when the tile contains a scene payload |

A tile can be empty, renderable, or a nested tileset. A selected tile is the runtime’s current rendering choice; the presence of a header does not imply that its content is already available.

## Coordinate systems[​](#coordinate-systems "Direct link to Coordinate systems")

Tile positions may be represented in:

* fixed-frame Cartesian coordinates, typically WGS84 ECEF
* local or cartographic coordinates relative to a tile origin, with positions in meters

Transforms and origins are source data, not assumptions hidden by the category. I3S can additionally request explicit horizontal and vertical placement; see [I3S coordinate reference systems](https://loaders.gl/next/docs/modules/tiles-3d/i3s/concepts/coordinate-reference-systems.md) and [vertical coordinate systems](https://loaders.gl/next/docs/developer-guide/vertical-coordinate-systems.md).

## Standards and format details[​](#standards-and-format-details "Direct link to Standards and format details")

* [OGC 3D Tiles standard](https://www.ogc.org/standards/3DTiles)
* [OGC I3S standard](https://www.ogc.org/standards/i3s)
* [Potree format](https://potree.github.io/)
* [3D Tiles format compatibility matrix](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/formats/3d-tiles.md)
* [Tiles runtime module](https://loaders.gl/next/docs/modules/tiles.md)
