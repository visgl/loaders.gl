# RFC: Normalize 3D Tile Loaders

- **Authors**: Xintong Xia
- **Date**: Jan 2020
- **Status**: Draft

## Abstract

This RFC focuses on consolidating Cesium tile 3d loaders and i3s loaders and output a unified format, which could support or easy to extend from a Tile 3D Loader to work with other 3D tile formats (Potree, etc.).

## Motivation

Both Cesium 3D tiles and ArcGIS I3S are open specifications for easily streaming and sharing massive 3D content across different platforms.
Although the specs are distinct from each other, they do share the fundamental components in common. Both specifications divide massive dataset into small and renderable chunks that structured in a hierarchical tree.
Child tiles in the tree are subdivisions of their parents and have finer details, such that less data can be visualized by only loading and drawing the visible regions and level of details can be dynamically
displayed by zoom level.

- Dynamically loading the dataset based on viewport requires tree traversing and strategies to decide whether a specific tile node is sufficient for current viewport (geo boundaries, zoom).
- The math needed for loading is common in either graphics or geospatial, i.e. Bounding Box, frustum culling, Ellipsoid, and coordinate transformations, etc.
- To provide smooth user interaction with the map (panning, zooming), requires frequently loading and unloading tiles, and thus request scheduling and caching are needed to manage tile nodes efficiently.
- A unified parsed format for 3d tiles category will empower all the rendering frameworks to load different 3D tiles specifications.

Therefore this RFC joins the 3D tiles and i3s loaders and specifies the semantics of the unified output format. This would also potentially benefit loading other 3D standards, i.e. Potree.

## Concepts

- [OGC 3D Tiles](https://www.opengeospatial.org/standards/3DTiles) standard
- [OGC i3s](https://www.opengeospatial.org/standards/i3s) standard
- **Tile Header Hierarchy** - An initial, "minimal" set of data listing the _hierarchy of available tiles_, with minimal information to allow an application to determine which tiles need to be loaded based on a certain viewing position in 3d space.
- **Tile Header** - A minimal header describing a tiles bounding volume and a screen space error tolerance (allowing the tile to be culled if it is distant), as well as the URL to load the tile's actual content from.
- **Tile Cache** - Since the number of tiles in big tilesets often exceed what can be loaded into available memory, it is important to have a system that releases no-longer visible tiles from memory.
- **Tileset Traversal** - Dynamically loading and rendering 3D tiles based on current viewing position, possibly triggering loads of new tiles and unloading of older, no-longer visible tiles.

## Components

- [`Tileset3DLoader`](docs/api-reference/3d-tiles/tileset-3d-loader): Load a tileset into a json object.
- [`Tileset3D`](docs/api-reference/3d-tiles/tileset-3d):
- [`Tile3DLoader`](docs/api-reference/3d-tiles/tile-3d-loader): Load a tile node in a tileset.
- [`Tile3DHeader`](docs/api-reference/3d-tiles/tile-3d-header)

## Usage

1. Load a tileset

```js
import {Tileset3DLoader, Tileset3D} from '@loaders.gl/3d-tiles';
import {load} from '@loaders.gl/core';

const tilesetUrl = 'A tileset url';

// load 3d tiles from ion
const tilesetJSON = await load(tilesetUrl, Tileset3DLoader, {
  ionAssetId,
  ionAssetToken
});

// load i3s tileset
const tilesetJSON = await load(tilesetUrl, I3STilesetLoader);
```

2. Construct `Tileset3D` instance

```js
const tileset3d = new Tileset3D(tilesetJson, tilesetUrl, {
  onTileLoad: tile => console.log(tile),
  onTileUnload: tile => console.log(tile),
  onTileError: ((tile, message, url) => console.error(message)
});
```

3. Update selected tiles for render under current viewport

```js
tileset3d.update(viewport);
console.log(tileset3d.selectedTiles);
```

4. Render selected tiles

```js
tileset3d.selectedTiles.map(tileHeader => {
  return {
    if (!tileHeader.layerType) {
      return null;
    }

    switch (tileHeader.layerType) {
      case 'pointcloud':
        return createPointCloudTileLayer(tileHeader);
      case 'scenegraph':
        return create3DModelTileLayer(tileHeader);
      case 'simplemesh':
        return createSimpleMeshLayer(tileHeader);
      default:
        throw new Error(`Tile3DLayer: Failed to render layer of type ${tileHeader.layerType}`);
    }
  }
});
```
