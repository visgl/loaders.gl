Vector tile module

# Keep tiled map delivery separate from map rendering.

The MVT module parses and writes Mapbox Vector Tiles, reads TileJSON and map styles, and provides sources for pre-tiled or dynamically generated vector data.

[MVT format](https://loaders.gl/next/docs/modules/tiles/mvt/formats/mvt.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles/mvt/formats/mvt.md)[Using sources](https://loaders.gl/next/docs/developer-guide/using-sources.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/using-sources.md)

Vector tile delivery

## Request map pieces. Decode features where they are used.

Vector-tile metadata describes the grid and the style describes how layers are used. A source can request only the tiles near the current view, while the decoder keeps the protobuf boundary separate from rendering.

Map context

**Viewport**bounds and zoom

[**TileJSON**scheme and limits↗](https://loaders.gl/next/docs/modules/tiles/mvt/formats/tilejson.md)[**Map style**layers and sources↗](https://loaders.gl/next/docs/modules/tiles/mvt/formats/map-style.md)

addres&#x73;**→**

z / x / y

Vector tile source

requestdecodecache

MVT protobuf · source lifecycle

shap&#x65;**→**

Application result

**Features**decoded geometry and properties

**Binary data**typed buffers for rendering

[**Arrow table**optional columnar view↗](https://loaders.gl/next/docs/specifications/category-table.md)

Tile addressing and feature decoding stay reusable whether the source is a static tile set, a generated table source, or a service-backed vector layer.

The vector-tile path

## Decode a tile, or let a source manage the tile set.

The module keeps the binary tile format, its metadata, and the source that requests tiles as related but separate layers. Applications can choose the level of control they need.

01

Read

MVT protobuf into feature or binary data

02

Describe

TileJSON bounds, schemes, and tilestats

03

Source

Request pre-tiled or generated vector tiles

04

Write

Encode compatible feature data as MVT

The `@loaders.gl/tiles/mvt` module handles the [Mapbox Vector Tile](https://loaders.gl/next/docs/modules/tiles/mvt/formats/mvt.md) format, a protobuf-encoded format that defines geospatial geometries.

The module also provides `TableTileSourceLoader` for generating dynamic tiles from an in-memory GeoJSON table.

For Arrow input, `ArrowTableTileSourceLoader` generates GeoArrow WKB tiles while preserving typed attribute columns without a GeoJSON property round-trip.

Detailed guide

## Vector tile module details

The sections below cover installation, loaders, writers, sources, formats, and tile-specific data behavior.

## Installation[​](#installation "Direct link to Installation")

```
npm install @loaders.gl/tiles

npm install @loaders.gl/core
```

## Loaders and Writers[​](#loaders-and-writers "Direct link to Loaders and Writers")

| Loader / Writer / Source                                                                                                            | Description                                               |
| ----------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| [`MapStyleLoader`](https://loaders.gl/next/docs/modules/tiles/mvt/api-reference/map-style-loader.md)                           | Parses MapLibre and Mapbox style JSON.                    |
| [`MVTLoader`](https://loaders.gl/next/docs/modules/tiles/mvt/api-reference/mvt-loader.md)                                      | Parses Mapbox Vector Tiles.                               |
| [`TileJSONLoader`](https://loaders.gl/next/docs/modules/tiles/mvt/api-reference/tilejson-loader.md)                            | Parses TileJSON metadata and tilestats.                   |
| [`MVTWriter`](https://loaders.gl/next/docs/modules/tiles/mvt/api-reference/mvt-writer.md)                                      | Writes Mapbox Vector Tile data.                           |
| [`MVTSourceLoader`](https://loaders.gl/next/docs/modules/tiles/mvt/api-reference/mvt-source-loader.md)                         | Dynamically loads tiles from pre-tiled MVT hierarchies.   |
| [`TableTileSourceLoader`](https://loaders.gl/next/docs/modules/tiles/mvt/api-reference/table-tile-source-loader.md)            | Generates vector tiles from geospatial tables on the fly. |
| [`ArrowTableTileSourceLoader`](https://loaders.gl/next/docs/modules/tiles/mvt/api-reference/arrow-table-tile-source-loader.md) | Generates Arrow vector tiles from in-memory Arrow tables. |

## Formats[​](#formats "Direct link to Formats")

| Format                                                                                   | Description                                         |
| ---------------------------------------------------------------------------------------- | --------------------------------------------------- |
| [`Map Styles`](https://loaders.gl/next/docs/modules/tiles/mvt/formats/map-style.md) | MapLibre and Mapbox style JSON documents.           |
| [`MVT`](https://loaders.gl/next/docs/modules/tiles/mvt/formats/mvt.md)              | Binary vector tiles containing geospatial geometry. |
| [`TileJSON`](https://loaders.gl/next/docs/modules/tiles/mvt/formats/tilejson.md)    | JSON metadata describing tiled map resources.       |

## Attribution[​](#attribution "Direct link to Attribution")

The `MVTLoader` is forked from the Mapbox [`@mapbox/vector-tile`](https://github.com/mapbox/vector-tile-js) module under the BSD-3-Clause license.

The `TableTiler` class is a fork of Mapbox / Vladimir Agafonkin's amazing [geojson-vt](https://github.com/mapbox/geojson-vt) module under ISC License.
