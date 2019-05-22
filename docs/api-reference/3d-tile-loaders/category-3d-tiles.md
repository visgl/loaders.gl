# 3D Tiles Category

> The 3D tile loaders are still under development. If you are interested in early access, please open an issue.

Support for loading and traversing [3D Tile Sets](https://github.com/AnalyticalGraphicsInc/3d-tiles).

The plan is to provide the following loaders/writers:
- `Tile3DLoader` for individual tiles
- `Tileset3DLoader` for the tileset
- `Tile3DWriter` for individual tiles

And the following helper classes
- `Tileset3D` to help access the loaded tileset.
- `Tile3D` to help access a loaded tile.
- `Tileset3DTraversal` class that accepts view frustum parameters and returns a culled, prioritized list of tiles to show.
- `Tileset3DCache` class that loads and LRU discards tiles based on prioritized lists (from Tileset3DTraversal).

Note:
- 3D tiles support in loaders.gl is developed in collaboration with the Cesium team.
