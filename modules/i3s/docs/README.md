# Overview

The `@loaders.gl/i3s` module supports loading and traversing Indexed 3d Scene Layer (I3S).

References

- [I3S Tiles Specification](https://github.com/Esri/i3s-spec) - The living specification.
- [I3S Tiles Standard](http://www.ogc.org/standards/i3s) - The official standard from [OGC](http://www.ogc.org/standards/i3s), the Open Geospatial Consortium.

## Installation

```bash
npm install @loaders.gl/i3s
npm install @loaders.gl/core
```

## API

A standard complement of loader is provided to load the individual 3d Tile file formats:

- [`I3SLoader`](modules/3d-tiles/docs/api-reference/i3s-loader), a loader for loading a top-down or nested tileset and its tiles.

To handle the complex dynamic tile selection and loading required to performantly render larger-than-browser-memory tilesets, additional helper classes are provided in `@loaders.gl/tiles` module:

- [`Tileset3D`](modules/3d-tiles/docs/api-reference/tileset-3d) to work with the loaded tileset.
- [`Tile3D`](modules/3d-tiles/docs/api-reference/tile-3d) to access data for a specific tile.

## Usage

Basic API usage is illustrated in the following snippet. Create a `Tileset3D` instance, point it a valid tileset URL, set up callbacks, and keep feeding in new camera positions:

```js
import {load} from '@loaders.gl/core';
import {I3SLoader} from '@loaders.gl/i3s';
import {Tileset3D} from '@loaders.gl/tiles';

const tilesetUrl = ''; // add the url to your tileset.json file here

const tilesetJson = await load(tilesetUrl, I3SLoader);

const tileset3d = new Tileset3D(tilesetJson, {
  onTileLoad: tile => console.log(tile)
});

// initial viewport
tileset3d.update(viewport);

// Viewport changes (pan zoom etc)
tileset3d.update(viewport);

// Visible tiles
const visibleTiles = tileset3d.tiles.filter(tile => tile.selected);

// Note that visibleTiles will likely not immediately include all tiles
// tiles will keep loading and file `onTileLoad` callbacks
```

## Remarks

`@loaders.gl/3s` is still under experimental, and mainly support decoding `MeshPyramids` (3D Object and Integrated Mesh) profiles.

## Attribution
