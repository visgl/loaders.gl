MLT module

# Decode compact vector tiles without changing the tile path.

`@loaders.gl/tiles/mlt` supports MapLibre Tile vector data through a direct loader and a URL-addressed source. Both paths use the MapLibre decoder while fitting the normal loaders.gl data contracts.

[MLT APIs](https://loaders.gl/next/docs/modules/tiles/mlt/api-reference/mlt-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles/mlt/api-reference/mlt-loader.md)[MLT format](https://loaders.gl/next/docs/modules/tiles/mlt/formats/mlt.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles/mlt/formats/mlt.md)[MLT source](https://loaders.gl/next/docs/modules/tiles/mlt/api-reference/mlt-source-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles/mlt/api-reference/mlt-source-loader.md)

The MLT module boundary

## Choose direct decoding or a tile source.

Use the loader when the tile bytes are already available. Use the source when the application needs URL addressing, metadata, and repeated tile requests.

01

Loader

Decode one MapLibre Tile payload

02

Source

Resolve and request URL-addressed tiles

03

Geometry

GeoJSON-style or binary geometry output

04

Decoder

@maplibre/mlt implementation underneath

Detailed guide

## Loader and source details

The reference below covers installation, entry points, examples, output choices, and the upstream decoder relationship.

![From-v4.4](https://img.shields.io/badge/From-v4.4-blue.svg?style=flat-square)

Support for loading [MapLibre Tile](https://loaders.gl/next/docs/modules/tiles/mlt/formats/mlt.md) vector tiles.

## Installation[​](#installation "Direct link to Installation")

```
npm install @loaders.gl/tiles

npm install @loaders.gl/core
```

## Loaders and Sources[​](#loaders-and-sources "Direct link to Loaders and Sources")

| Loader / Source                                                                                             | Description                                                              |
| ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| [`MLTWriter`](https://loaders.gl/next/docs/modules/tiles/mlt/api-reference/mlt-writer.md)              | Encodes tile-local GeoArrow WKB and scalar columns as MLT v1. From v5.0. |
| [`MLTLoader`](https://loaders.gl/next/docs/modules/tiles/mlt/api-reference/mlt-loader.md)              | Loads MapLibre Tile vector tiles.                                        |
| [`MLTSourceLoader`](https://loaders.gl/next/docs/modules/tiles/mlt/api-reference/mlt-source-loader.md) | Loads MapLibre Tile data as a tile source.                               |

## Examples[​](#examples "Direct link to Examples")

* [MLT example](https://loaders.gl/next/examples/tiles/mlt)

## Attribution[​](#attribution "Direct link to Attribution")

The `MLTLoader` uses the [@maplibre/mlt](https://github.com/maplibre/mlt) package for tile decoding.
