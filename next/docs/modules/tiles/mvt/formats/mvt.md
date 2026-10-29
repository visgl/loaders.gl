Vector tile format

# Request the tile that covers the view.

Mapbox Vector Tiles package geometry and properties into protobuf layers addressed by z/x/y. They are optimized for tiled delivery, not for pretending a whole map is one table.

[MVT module](https://loaders.gl/next/docs/modules/tiles/mvt.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles/mvt.md)[MVT source](https://loaders.gl/next/docs/modules/tiles/mvt/api-reference/mvt-source-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles/mvt/api-reference/mvt-source-loader.md)

[Try MVT](https://loaders.gl/next/examples/tiles/mvt)[Try PMTiles](https://loaders.gl/next/examples/tiles/pmtiles)[Create PMTiles](https://loaders.gl/next/examples/tiles/pmtiles-authoring)[Try Arrow Tiler](https://loaders.gl/next/examples/tiles/table-tiler)[Try MLT](https://loaders.gl/next/examples/tiles/mlt)[MVT](https://loaders.gl/next/docs/modules/tiles/mvt/formats/mvt.md)[PMTiles](https://loaders.gl/next/docs/modules/tiles/pmtiles/formats/pmtiles.md)[Arrow Table Tiler](https://loaders.gl/next/docs/modules/tiles/mvt/api-reference/arrow-table-tile-source-loader.md)[TableTileSourceLoader](https://loaders.gl/next/docs/modules/tiles/mvt/api-reference/table-tile-source-loader.md)[MLT](https://loaders.gl/next/docs/modules/tiles/mlt/formats/mlt.md)

The tile contract

## Small geographic pieces, decoded on demand.

An MVT payload contains named layers and feature properties. The source chooses tiles; the decoder turns each payload into geometry or an optional table view.

01

Address

Zoom, column, row, and optional layer

02

Payload

Protobuf-encoded feature layers

03

Geometry

Tile-local points, lines, and polygons

04

Scan view

One selected tile can expose Arrow batches

[![Optional scan table view](https://img.shields.io/badge/Scan-Table_view-3178C6.svg?style=flat-square)](https://loaders.gl/next/docs/modules/core/scan#vector-table-views)

* *[`@loaders.gl/tiles/mvt`](https://loaders.gl/next/docs/modules/tiles/mvt.md)*
* *[Mapbox Vector Tile Specification](https://github.com/mapbox/vector-tile-spec)*

A specification for encoding tiled vector data.

MVT is a protobuf-encoded format that defines geospatial geometries.

tiles contain layers with features, the features can have geometries and properties.

## Optional scan table view[​](#optional-scan-table-view "Direct link to Optional scan table view")

MVT remains a tile format: z/x/y and layer selection do not become relational query operators. When an `MVTSource` is configured for Arrow table output, `VectorTileTableScanSource` can bind one tile and expose its decoded features to the portable table executor.

| Capability                                                          | Support                                                             |
| ------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Tile address and layer selection                                    | ✅ Specialized MVT source parameters                                |
| Table metadata                                                      | ✅ Discovered after the bound tile is decoded                       |
| Predicate, projection, expressions, ordering, aggregates, and limit | ✅ Residual Arrow execution                                         |
| Cancellation                                                        | ✅ Supported while resolving the tile and executing the table query |
| Cross-tile scan planning                                            | ❌ Not provided                                                     |
| Tile-statistics pushdown                                            | ❌ Not provided                                                     |

The blue badge describes an optional view over one physically selected tile. It is intentionally different from a format-native common scan.

Detailed guide

## MVT encoding and source behavior

The sections below cover the optional table view, metadata, geometry encoding, and the boundaries between tile addressing and scan execution.

## Metadata[​](#metadata "Direct link to Metadata")

It is often useful to have global metadata about a tileset. A common complementary format for encoding tileset metadata is [TileJSON](https://loaders.gl/next/docs/modules/tiles/mvt/formats/tilejson.md).

## Encoding[​](#encoding "Direct link to Encoding")

If you want to know more about how geometries are encoded into MVT tiles, see this section in the [specification](https://docs.mapbox.com/vector-tiles/specification/#encoding-geometry).
