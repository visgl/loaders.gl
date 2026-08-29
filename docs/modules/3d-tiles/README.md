---
title: '@loaders.gl/3d-tiles'
description: Load and traverse large 3D Tiles datasets with standards-aware tile and content handling.
hide_title: true
page_style: designed
---

import {Tiles3DDocsTabs} from '@site/src/components/docs/tiles-3d-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Tiled scene module"
  title="@loaders.gl/3d-tiles"
  description="Resolve tileset structure, linked content, and level-of-detail decisions without making the application understand every 3D Tiles detail."
  tone="violet"
  meta={['3D Tiles', 'Tileset traversal', 'glTF and point clouds']}
  links={[
    {label: '3D Tiles format', to: '/docs/modules/3d-tiles/formats/3d-tiles'},
    {label: 'Tiles3DLoader', to: '/docs/modules/3d-tiles/api-reference/tiles-3d-loader'},
    {label: 'Using sources', to: '/docs/developer-guide/using-sources'}
  ]}
/>

<Tiles3DDocsTabs active="module" />

![ogc-logo](../../images/logos/ogc-logo-60.png)
&nbsp;
![3dtiles-logo](./images/3d-tiles-logo-60.png)

The `@loaders.gl/3d-tiles` module supports loading and traversing 3D Tiles.

See the [3D Tiles format compatibility matrix](/docs/modules/3d-tiles/formats/3d-tiles) for a capability-by-capability
summary of parser, traversal, extension, and renderer-facing support.

<DocOrientation
  eyebrow="The 3D Tiles module"
  title="Keep the hierarchy. Request the visible pieces."
  description="The module separates tileset parsing from view-dependent traversal, so applications can work with large worlds while retaining bounds, refinement, content references, and source metadata."
  tone="violet"
  items={[
    {label: 'Parse', value: 'Tileset JSON, archives, payloads, and extensions'},
    {label: 'Traverse', value: 'Bounds, screen-space error, refinement, and visibility'},
    {label: 'Resolve', value: 'glTF, points, composites, nested tilesets, and subtrees'},
    {label: 'Integrate', value: 'Tileset3D and Tile3D for application-owned rendering'}
  ]}
/>

## Standards

- [3D Tiles Specification](https://github.com/AnalyticalGraphicsInc/3d-tiles) - The living specification.
- [3D Tiles Standard](https://www.opengeospatial.org/standards/3DTiles) - The official standard from [OGC](https://www.opengeospatial.org/), the Open Geospatial Consortium.

## Installation

```bash
npm install @loaders.gl/core @loaders.gl/3d-tiles @loaders.gl/tiles
```

## API

The module provides loaders for the individual 3D Tiles payload forms:

- [`Tiles3DLoader`](/docs/modules/3d-tiles/api-reference/tiles-3d-loader), a loader for loading a top-down or nested tileset and its tiles.
- [`CesiumIonLoader`](/docs/modules/3d-tiles/api-reference/cesium-ion-loader), a `Tiles3DLoader` variant that resolves credentials and tileset URLs from Cesium ion.

For dynamic selection and loading of tilesets larger than browser memory, use the helper classes in
the `@loaders.gl/tiles` module:

- [`Tileset3D`](/docs/modules/tiles/api-reference/tileset-3d) to work with the loaded tileset.
- [`Tile3D`](/docs/modules/tiles/api-reference/tile-3d) to access data for a specific tile.

The [3D Tiles runtime concepts suite](/docs/modules/3d-tiles/concepts) explains the complete path from hierarchy traversal to rendering:

- [Resource resolution and content detection](/docs/modules/3d-tiles/concepts/resource-resolution-and-content-detection)
- [Tile hierarchy and refinement](/docs/modules/3d-tiles/concepts/tile-hierarchy-and-refinement)
- [Implicit tiling and lazy subtrees](/docs/modules/3d-tiles/concepts/implicit-tiling-and-subtrees)
- [Screen-space error and level of detail](/docs/modules/3d-tiles/concepts/screen-space-error-and-lod)
- [Request scheduling, progressive loading, and foveated requests](/docs/modules/3d-tiles/concepts/request-scheduling-and-priorities)
- [Caching and memory](/docs/modules/3d-tiles/concepts/caching-and-memory)
- [Runtime tuning and diagnostics](/docs/modules/3d-tiles/concepts/runtime-tuning-and-diagnostics)

<ReferenceBoundary
  title="Module APIs and runtime concepts"
  description="The reference below covers installation, loaders, traversal helpers, usage, runtime concepts, and the current compatibility boundaries."
  tone="violet"
/>

## Usage

Basic API usage is illustrated in the following snippet. Load the tileset header, create a `Tileset3D` instance, and keep selecting tiles as the camera moves:

```typescript
import {Tiles3DLoader} from '@loaders.gl/3d-tiles';
import {Tiles3DSource, Tileset3D} from '@loaders.gl/tiles';

const tilesetUrl = 'https://example.com/tileset.json';
const source = new Tiles3DSource({url: tilesetUrl, loader: Tiles3DLoader});

const tileset = new Tileset3D(source, {
  onTileLoad: (tile) => console.log(tile)
});

await tileset.selectTiles(viewport);

// Call again whenever the viewport changes.
await tileset.selectTiles(viewport);

// Visible tiles
const visibleTiles = tileset.tiles.filter((tile) => tile.selected);

// Visible tiles may change while content continues loading.
```

## Remarks

`@loaders.gl/3d-tiles` does not yet support the full 3D tiles standard. Notable omissions are:

- [Region bounding volumes](https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/specification#bounding-volume) are supported but not optimally
- [Styling](https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/specification/Styling) is not yet supported
- [Viewer request volumes](https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/specification#viewer-request-volume) are not yet supported

## Attribution

`@loaders.gl/3d-tiles` includes code derived from the [Cesium repository](https://github.com/AnalyticalGraphicsInc/cesium)
under the Apache 2.0 license and is maintained in collaboration with the Cesium engineering team.
