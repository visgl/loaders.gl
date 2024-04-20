# Overview

The `@loaders.gl/mvt` module handles the [Mapbox Vector Tile](/docs/modules/mvt/formats/mvt) format, a protobuf-encoded format that defines geospatial geometries.

The modules also provides a `GeoJSONTiler` class that can serve up equivalent parsed
tiles from an in-memory `GeoJSON` file.

## Installation

```bash
npm install @loaders.gl/mvt
npm install @loaders.gl/core
```

## Loaders and Writers

| Loader                                                   |
| -------------------------------------------------------- |
| [`MVTLoader`](/docs/modules/mvt/api-reference/mvt-loader) |

## Sources

| Component                                                      |
| -------------------------------------------------------------- |
| [`MVTSource`](/docs/modules/mvt/api-reference/mvt-source) |
| [`GeoJSONTiler`](/docs/modules/mvt/api-reference/geojson-tile-source) |

## Attribution

The `MVTLoader` is forked from the Mapbox [`@mapbox/vector-tile`](https://github.com/mapbox/vector-tile-js) module under the BSD-3-Clause license.

The `GeoJSONTiler` class is a fork of Mapbox / Vladimir Agafonkin's amazing [geojson-vt](https://github.com/mapbox/geojson-vt) module under ISC License.
