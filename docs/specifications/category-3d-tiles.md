# 3D Tiles Loaders

> The 3D tiles category is experimental.

The 3D Tiles category defines a generalized representation of hierarchical geospatial data structures.

## 3D Tiles Category Loaders

| Loader                                                                     | Notes |
| -------------------------------------------------------------------------- | ----- |
| [`Tiles3DLoader`](modules/3d-tiles/docs/api-reference/tiles-3d-loader)     |       |
| [`CesiumIonLoader`](modules/3d-tiles/docs/api-reference/cesium-ion-loader) |       |
| [`I3SLoader`](modules/i3s/docs/api-reference/i3s-loader)                   |       |
| [`PotreeLoader`](modules/potree/docs/api-reference/potree-loader)          |       |

## Overview

The 3D Tiles category is can represent the

- [OGC 3D Tiles](https://www.opengeospatial.org/standards/3DTiles) standard
- [OGC i3s](https://www.opengeospatial.org/standards/i3s) standard
- `potree` format as well.

## Concepts

- **Tile Header Hierarchy** - An initial, "minimal" set of data listing the _hierarchy of available tiles_, with minimal information to allow an application to determine which tiles need to be loaded based on a certain viewing position in 3d space.
- **Tile Header** - A minimal header describing a tiles bounding volume and a screen space error tolerance (allowing the tile to be culled if it is distant), as well as the URL to load the tile's actual content from.
- **Tile Cache** - Since the number of tiles in big tilesets often exceed what can be loaded into available memory, it is important to have a system that releases no-longer visible tiles from memory.
- **Tileset Traversal** - Dynamically loading and rendering 3D tiles based on current viewing position, possibly triggering loads of new tiles and unloading of older, no-longer visible tiles.

## Data Format

Check [`Tiles3DLoader`](modules/3d-tiles/docs/api-reference/tiles-3d-loader), [`CesiumIonLoader`](modules/3d-tiles/docs/api-reference/cesium-ion-loader) | |
and [`I3SLoader`](modules/i3s/docs/api-reference/i3s-loader).

## Helper Classes

Tileset Traversal Support

To start loading tiles once a top-level tileset file is loaded, the application can instantiate the `Tileset3D` class and start calling `tileset3D.update(viewport)`.

Since 3D tiled data sets tend to be very big, the key idea is to only load the tiles actually needed to show a view from the current camera position.

The `Tileset3D` allows callbacks (`onTileLoad`, `onTileUnload`) to be registered that notify the app when the set of tiles available for rendering has changed. This is important because tile loads complete asynchronously, after the `tileset3D.update(...)` call has returned.

## Additional Information

### Coordinate Systems

To help applications process the `position` data in the tiles, 3D Tiles category loaders are expected to provide matrices are provided to enable tiles to be used in both fixed frame or cartographic (long/lat-relative, east-north-up / ENU) coordinate systems:

- _cartesian_ WGS84 fixed frame coordinates
- _cartographic_ tile geometry positions to ENU meter offsets from `cartographicOrigin`.

Position units in both cases are in meters.

For cartographic coordinates, tiles come with a prechosen cartographic origin and precalculated model matrix. This cartographic origin is "arbitrary" (chosen based on the tiles bounding volume center). A different origin can be chosen and a transform can be calculated, e.g. using the math.gl `Ellipsoid` class.
