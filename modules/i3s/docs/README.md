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

## Remarks

`@loaders.gl/3s` is still under experimental, and mainly support decoding `MeshPyramids` (3D Object and Integrated Mesh) profiles.

## Attribution
