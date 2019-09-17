# Overview

![logo](./images/3d-tiles-small.png)

The `@loaders.gl/3d-tiles` module supports loading and traversing 3D Tiles.

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

- [`Tileset3DLoader`](modules/3d-tiles/docs/api-reference/tileset-3d-loader), a loader for top-level (or nested) tilesets files.
- [`Tile3DLoader`](modules/3d-tiles/docs/api-reference/tile-3d-loader) for individual tiles.
- [`Tile3DWriter`](modules/3d-tiles/docs/api-reference/tile-3d-writer) for individual tiles.

To handle the complex dynamic tile selection and loading required to performantly render larger-than-browser-memory tilesets, additional helper classes are provided:

- [`Tileset3D`](modules/3d-tiles/docs/api-reference/tileset-3d) to work with the loaded tileset.
- `Tile3DHeader` (currently undocumented) to access data for a specific tile.

## Usage

Basic API usage is illustrated in the following snippet. Create a `Tileset3D` instance, point it a valid tileset URL, set up callbacks, and keep feeding in new camera positions:

```js
import {Tileset3D} from '@loaders.gl/3d-tiles';
const tileset = new Tileset3D(tilesetJson, {
  url: TILESET_URL,
  onTilesetLoad: tileset => console.log('Tileset loaded'),
  onTileLoad: tileset => console.log('Tile loaded'),
  onTileUnload: tileset => console.log('Tile unloaded')
});

// initial camera view
let visibleTiles = tileset3d.traverse(cameraParameters1);

// Camera changes (pan zoom etc)
visibleTiles = tileset3d.traverse(cameraParameters2);

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
