# @loaders.gl/pmtiles

[loaders.gl](https://loaders.gl/docs) is a collection of framework-independent 3D and geospatial parsers and encoders.

This module contains loaders for the pmtiles format.

The loader supports PMTiles specification version 3 archives, including MVT, raster, and MapLibre
Tile (MLT) tile types. MLT tiles are decoded through `@loaders.gl/mlt` when requested from a
`PMTilesTileSource`.

MLT tiles support the MLT decoder's `geojson-table`, `binary-geometry`, and `arrow-table` shapes;
the PMTiles `columnar-table` shape remains available for MVT tiles only.

For documentation please visit the [website](https://loaders.gl).
