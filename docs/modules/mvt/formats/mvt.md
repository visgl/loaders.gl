import {TileDocsTabs} from '@site/src/components/docs/tile-docs-tabs';

# Mapbox Vector Tile

<TileDocsTabs active="mvt" />

<p class="badges">
  <a href="/docs/modules/scan#vector-table-views">
    <img src="https://img.shields.io/badge/Scan-Table_view-3178C6.svg?style=flat-square" alt="Optional scan table view" />
  </a>
</p>

- _[`@loaders.gl/mvt`](/docs/modules/mvt)_
- _[Mapbox Vector Tile Specification](https://github.com/mapbox/vector-tile-spec)_

A specification for encoding tiled vector data.

MVT is a protobuf-encoded format that defines geospatial geometries.

tiles contain layers with features, the features can have geometries and properties.

## Optional scan table view

MVT remains a tile format: z/x/y and layer selection do not become relational query operators. When
an `MVTSource` is configured for Arrow table output, `VectorTileTableScanSource` can bind one tile
and expose its decoded features to the portable table executor.

| Capability | Support |
| --- | --- |
| Tile address and layer selection | Specialized MVT source parameters |
| Table metadata | Discovered after the bound tile is decoded |
| Predicate, projection, expressions, ordering, aggregates, and limit | Residual Arrow execution |
| Cancellation | Supported while resolving the tile and executing the table query |
| Cross-tile scan planning | Not provided |
| Tile-statistics pushdown | Not provided |

The blue badge describes an optional view over one physically selected tile. It is intentionally
different from a format-native common scan.

## Metadata

It is often useful to have global metadata about a tileset. A common complementary format for encoding tileset metadata is [TileJSON](./tilejson).

## Encoding

If you want to know more about how geometries are encoded into MVT tiles, see this section in the [specification](https://docs.mapbox.com/vector-tiles/specification/#encoding-geometry).
