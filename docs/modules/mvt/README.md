# Overview

The `@loaders.gl/mvt` module handles the [Mapbox Vector Tile](/docs/modules/mvt/formats/mvt) format, a protobuf-encoded format that defines geospatial geometries.

The modules also provides a `TableTileSourceLoader` class that can serve up dynamic tiles from an in-memory `GeoJSON` file.

## Installation

```bash
npm install @loaders.gl/mvt
npm install @loaders.gl/core
```

## Loaders and Writers

| Loader / Writer / Source | Description |
| ----------------------- | ----------- |
| [`MapStyleLoader`](/docs/modules/mvt/api-reference/map-style-loader) | Parses MapLibre and Mapbox style JSON. |
| [`MVTLoader`](/docs/modules/mvt/api-reference/mvt-loader) | Parses Mapbox Vector Tiles. |
| [`TileJSONLoader`](/docs/modules/mvt/api-reference/tilejson-loader) | Parses TileJSON metadata and tilestats. |
| [`MVTWriter`](/docs/modules/mvt/api-reference/mvt-writer) | Writes Mapbox Vector Tile data. |
| [`MVTSourceLoader`](/docs/modules/mvt/api-reference/mvt-source-loader) | Dynamically loads tiles from pre-tiled MVT hierarchies. |
| [`TableTileSourceLoader`](/docs/modules/mvt/api-reference/table-tile-source-loader) | Generates vector tiles from geospatial tables on the fly. |

## Formats

| Format | Description |
| ------ | ----------- |
| [`Map Styles`](/docs/modules/mvt/formats/map-style) | MapLibre and Mapbox style JSON documents. |
| [`MVT`](/docs/modules/mvt/formats/mvt) | Binary vector tiles containing geospatial geometry. |
| [`TileJSON`](/docs/modules/mvt/formats/tilejson) | JSON metadata describing tiled map resources. |

## Attribution

The `MVTLoader` is forked from the Mapbox [`@mapbox/vector-tile`](https://github.com/mapbox/vector-tile-js) module under the BSD-3-Clause license.

The `TableTiler` class is a fork of Mapbox / Vladimir Agafonkin's amazing [geojson-vt](https://github.com/mapbox/geojson-vt) module under ISC License.
