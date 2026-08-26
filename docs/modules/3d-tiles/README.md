import {Tiles3DDocsTabs} from '@site/src/components/docs/tiles-3d-docs-tabs';

# Overview

<Tiles3DDocsTabs active="module" />

![ogc-logo](../../images/logos/ogc-logo-60.png)
&nbsp;
![3dtiles-logo](./images/3d-tiles-logo-60.png)

The `@loaders.gl/3d-tiles` module supports loading and traversing 3D Tiles.

See the [3D Tiles format compatibility matrix](./formats/3d-tiles) for a capability-by-capability
summary of parser, traversal, extension, and renderer-facing support.

References

- [3D Tiles Specification](https://github.com/AnalyticalGraphicsInc/3d-tiles) - The living specification.
- [3D Tiles Standard](https://www.opengeospatial.org/standards/3DTiles) - The official standard from [OGC](https://www.opengeospatial.org/), the Open Geospatial Consortium.

## Installation

```bash
npm install @loaders.gl/3d-tiles
npm install @loaders.gl/core
```

## API

A standard complement of loaders and writers are provided to load the individual 3d Tile file formats:

- [`Tiles3DLoader`](/docs/modules/3d-tiles/api-reference/tiles-3d-loader), a loader for loading a top-down or nested tileset and its tiles.
- [`CesiumIonLoader`](/docs/modules/3d-tiles/api-reference/cesium-ion-loader), a loader extends from `Tiles3DLoader` with resolving credentials from Cesium ion.

To handle the complex dynamic tile selection and loading required to performantly render larger-than-browser-memory tilesets, additional helper classes are provided in `@loaders.gl/tiles` module:

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

## Usage

Basic API usage is illustrated in the following snippet. Create a `Tileset3D` instance, point it a valid tileset URL, set up callbacks, and keep feeding in new camera positions:

```typescript
import {load} from '@loaders.gl/core';
import {Tiles3DLoader} from '@loaders.gl/3d-tiles';
import {Tileset3D} from '@loaders.gl/tiles';

const tilesetUrl = ''; // add the url to your tileset.json file here

const tilesetJson = await load(tilesetUrl, Tiles3DLoader);

const tileset3d = new Tileset3D(tilesetJson, {
  onTileLoad: (tile) => console.log(tile)
});

// initial viewport
tileset3d.update(viewport);

// Viewport changes (pan zoom etc)
tileset3d.selectTiles(viewport);

// Visible tiles
const visibleTiles = tileset3d.tiles.filter((tile) => tile.selected);

// Note that visibleTiles will likely not immediately include all tiles
// tiles will keep loading and file `onTileLoad` callbacks
```

## Remarks

`@loaders.gl/3d-tiles` does not yet support the full 3D tiles standard. Notable omissions are:

- [Region bounding volumes](https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/specification#bounding-volume) are supported but not optimally
- [Styling](https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/specification/Styling) is not yet supported
- [Viewer request volumes](https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/specification#viewer-request-volume) are not yet supported

## Attribution

`@loaders.gl/3d-tiles` is a fork of 3D tile related code in the [Cesium github repository](https://github.com/AnalyticalGraphicsInc/cesium) under Apache 2 License, and is developed in collabration with the Cesium engineering team.
