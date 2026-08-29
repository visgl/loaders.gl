---
title: Mapbox Vector Tile format
description: A compact protobuf tile format for delivering vector features by map tile.
hide_title: true
page_style: designed
---

import {TileDocsTabs} from '@site/src/components/docs/tile-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Vector tile format"
  title="Request the tile that covers the view."
  description="Mapbox Vector Tiles package geometry and properties into protobuf layers addressed by z/x/y. They are optimized for tiled delivery, not for pretending a whole map is one table."
  tone="blue"
  meta={['Protocol Buffers', 'z/x/y tiles', 'Layered features']}
  links={[
    {label: 'MVT module', to: '/docs/modules/mvt'},
    {label: 'MVT source', to: '/docs/modules/mvt/api-reference/mvt-source-loader'}
  ]}
/>

<TileDocsTabs active="mvt" />

<DocOrientation
  eyebrow="The tile contract"
  title="Small geographic pieces, decoded on demand."
  description="An MVT payload contains named layers and feature properties. The source chooses tiles; the decoder turns each payload into geometry or an optional table view."
  tone="blue"
  items={[
    {label: 'Address', value: 'Zoom, column, row, and optional layer'},
    {label: 'Payload', value: 'Protobuf-encoded feature layers'},
    {label: 'Geometry', value: 'Tile-local points, lines, and polygons'},
    {label: 'Scan view', value: 'One selected tile can expose Arrow batches'}
  ]}
/>

<p className="badges">
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

<ReferenceBoundary
  title="MVT encoding and source behavior"
  description="The sections below cover the optional table view, metadata, geometry encoding, and the boundaries between tile addressing and scan execution."
  tone="blue"
/>

## Metadata

It is often useful to have global metadata about a tileset. A common complementary format for encoding tileset metadata is [TileJSON](./tilejson).

## Encoding

If you want to know more about how geometries are encoded into MVT tiles, see this section in the [specification](https://docs.mapbox.com/vector-tiles/specification/#encoding-geometry).
