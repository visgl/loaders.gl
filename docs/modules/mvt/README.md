# Overview

The `@loaders.gl/mvt` module handles the [Mapbox Vector Tile](/docs/modules/mvt/formats/mvt) format, a protobuf-encoded format that defines geospatial geometries.

The modules also provides a `TableTileSourceLoader` class that can serve up dynamic tiles from an in-memory `GeoJSON` file.

## Installation

```bash
npm install @loaders.gl/mvt
npm install @loaders.gl/core
```

## Loaders and Writers

| Loader / Writer                                           |
| --------------------------------------------------------- |
| [`MapStyleLoader`](/docs/modules/mvt/api-reference/map-style-loader) |
| [`MVTLoader`](/docs/modules/mvt/api-reference/mvt-loader) |
| [`TileJSONLoader`](/docs/modules/mvt/api-reference/tilejson-loader) |
| [`MVTWriter`](/docs/modules/mvt/api-reference/mvt-writer) |

## Formats

| Format |
| ------ |
| [`Map Styles`](/docs/modules/mvt/formats/map-style) |
| [`MVT`](/docs/modules/mvt/formats/mvt) |
| [`TileJSON`](/docs/modules/mvt/formats/tilejson) |

## Sources

| Component                                                              |
| ---------------------------------------------------------------------- |
| [`MVTSourceLoader`](/docs/modules/mvt/api-reference/mvt-source-loader)              |
| [`TableTileSourceLoader`](/docs/modules/mvt/api-reference/table-tile-source-loader) |

## Attribution

The `MVTLoader` is forked from the Mapbox [`@mapbox/vector-tile`](https://github.com/mapbox/vector-tile-js) module under the BSD-3-Clause license.

The `TableTiler` class is a fork of Mapbox / Vladimir Agafonkin's amazing [geojson-vt](https://github.com/mapbox/geojson-vt) module under ISC License.
