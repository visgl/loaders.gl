---
title: 3D Tiles category
description: Load hierarchical worlds and point-cloud datasets through one tileset data model.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {TiledSceneGraphic} from '@site/src/components/docs/tiled-scene-graphic';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';
import {CategoryDataConcept} from '@site/src/components/home/concepts';

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

<CategoryDataConcept initialCategoryId="tiles" initialRepresentationId="plain" />

<TiledSceneGraphic />

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

:::info[Choose the runtime that matches the job]

- Use a format loader such as `Tiles3DLoader`, `I3SLoader`, or `PotreeLoader` when you need to
  inspect or load one resource.
- Use a source such as `Tiles3DSource` or `I3SSource` with `Tileset3D` when visibility, caching,
  request scheduling, and repeated viewport updates are part of the application.
- Use `SourceLayer` when a deck.gl application should connect a source directly to a renderer.

:::

<ReferenceBoundary
  title="The tileset contract"
  description="The sections below describe the shared tile representation, traversal lifecycle, coordinate systems, and helper classes."
  tone="violet"
/>

## Concepts

- **Tileset metadata** describes the source, coordinate context, and root of a hierarchy.
- **Tile headers** describe bounds, refinement, level of detail, child relationships, and content references.
- **Tile content** is the decoded application data for a selected tile.
- **Traversal** selects useful content for a viewport and manages requests, cache state, and release.

The category is intentionally format-neutral. A 3D Tiles source can use geometric error, while an
I3S source can use its own level-of-detail metric; both expose the result through the same runtime
selection model.

## Loader and runtime choices

Use a loader when the application needs to parse one resource. Use a source-backed runtime when
the application needs repeated, viewport-driven requests:

| Need | Entry point | Role |
| --- | --- | --- |
| Parse a 3D Tiles resource | [`Tiles3DLoader`](/docs/modules/3d-tiles/api-reference/tiles-3d-loader) | Decode a tileset or tile payload |
| Resolve Cesium ion data | [`CesiumIonLoader`](/docs/modules/3d-tiles/api-reference/cesium-ion-loader) | Resolve ion credentials and tileset URLs |
| Parse I3S resources | [`I3SLoader`](/docs/modules/i3s/api-reference/i3s-loader) | Decode I3S metadata, nodes, and content |
| Parse Potree resources | [`PotreeLoader`](/docs/modules/potree/api-reference/potree-loader) | Decode Potree hierarchy and point data |
| Traverse a tiled world | [`Tileset3D`](/docs/modules/tiles/api-reference/tileset-3d) | Select, request, cache, and release visible tiles |

<ReferenceBoundary
  title="The application-facing contract"
  description="The tables below summarize the common shape. Follow the source and runtime references for format-specific fields, options, and lifecycle details."
  tone="violet"
/>

## Traversal

Create the format-specific source, give it to `Tileset3D`, and await selection as the viewport
changes:

```typescript
import {Tiles3DLoader} from '@loaders.gl/3d-tiles';
import {Tiles3DSource, Tileset3D} from '@loaders.gl/tiles';

const source = new Tiles3DSource({
  url: 'https://example.com/tileset.json',
  loader: Tiles3DLoader
});
const tileset = new Tileset3D(source);

await tileset.selectTiles(viewport);
const selectedTiles = tileset.selectedTiles;
```

`selectTiles` waits for initialization and coalesces repeated viewport updates. Content may continue
arriving through the tile lifecycle after a selection pass. Use `onTileLoad` and `onTileUnload` when
the renderer needs to react to those changes. `update(viewport)` remains available as a
fire-and-forget compatibility wrapper.

For direct deck.gl integration, use [`SourceLayer`](/docs/developer-guide/using-sources) with the
source and format loaders. See [Using sources](/docs/developer-guide/using-sources) for the
renderer boundary.

## Application data

The following fields are common entry points, but a source may add format-specific metadata. Use
the [`Tile3D` reference](/docs/modules/tiles/api-reference/tile-3d) for runtime state and the
[3D Tiles format page](/docs/modules/3d-tiles/formats/3d-tiles) for payload conformance.

| Object | Common fields | Meaning |
| --- | --- | --- |
| Tileset | `type`, `url`, `root` | Source identity and the root tile header |
| Tile header | `id`, `type`, `boundingVolume`, `children`, `content` | Hierarchy, bounds, refinement inputs, and payload reference |
| Tile content | `modelMatrix`, `cartesianOrigin`, `cartographicOrigin`, `attributes` | Decoded data plus the transforms needed to place it |
| Point-cloud content | `pointCount`, `attributes.positions`, `attributes.colors` | Point count and render-ready point attributes when supplied |
| Scenegraph content | `gltf` | Decoded glTF scene data when the tile contains a scene payload |

A tile can be empty, renderable, or a nested tileset. A selected tile is the runtime’s current
rendering choice; the presence of a header does not imply that its content is already available.

## Coordinate systems

Tile positions may be represented in:

- fixed-frame Cartesian coordinates, typically WGS84 ECEF
- local or cartographic coordinates relative to a tile origin, with positions in meters

Transforms and origins are source data, not assumptions hidden by the category. I3S can additionally
request explicit horizontal and vertical placement; see [I3S coordinate reference systems](/docs/modules/i3s/concepts/coordinate-reference-systems)
and [vertical coordinate systems](/docs/developer-guide/vertical-coordinate-systems).

## Standards and format details

- [OGC 3D Tiles standard](https://www.ogc.org/standards/3DTiles)
- [OGC I3S standard](https://www.ogc.org/standards/i3s)
- [Potree format](https://potree.github.io/)
- [3D Tiles format compatibility matrix](/docs/modules/3d-tiles/formats/3d-tiles)
- [Tiles runtime module](/docs/modules/tiles)
