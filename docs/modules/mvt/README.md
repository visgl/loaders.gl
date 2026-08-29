---
title: '@loaders.gl/mvt'
description: Load, write, and serve Mapbox Vector Tiles and the metadata that describes tiled maps.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {VectorTileDeliveryGraphic} from '@site/src/components/docs/vector-tile-delivery-graphic';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Vector tile module"
  title="Keep tiled map delivery separate from map rendering."
  description="The MVT module parses and writes Mapbox Vector Tiles, reads TileJSON and map styles, and provides sources for pre-tiled or dynamically generated vector data."
  tone="violet"
  meta={['MVT / protobuf', 'TileJSON', 'Vector tile sources']}
  links={[
    {label: 'MVT format', to: '/docs/modules/mvt/formats/mvt'},
    {label: 'Using sources', to: '/docs/developer-guide/using-sources'}
  ]}
/>

<VectorTileDeliveryGraphic />

<DocOrientation
  eyebrow="The vector-tile path"
  title="Decode a tile, or let a source manage the tile set."
  description="The module keeps the binary tile format, its metadata, and the source that requests tiles as related but separate layers. Applications can choose the level of control they need."
  tone="violet"
  items={[
    {label: 'Read', value: 'MVT protobuf into feature or binary data'},
    {label: 'Describe', value: 'TileJSON bounds, schemes, and tilestats'},
    {label: 'Source', value: 'Request pre-tiled or generated vector tiles'},
    {label: 'Write', value: 'Encode compatible feature data as MVT'}
  ]}
/>

The `@loaders.gl/mvt` module handles the [Mapbox Vector Tile](/docs/modules/mvt/formats/mvt) format, a protobuf-encoded format that defines geospatial geometries.

The modules also provides a `TableTileSourceLoader` class that can serve up dynamic tiles from an in-memory `GeoJSON` file.

<ReferenceBoundary
  title="Vector tile module details"
  description="The sections below cover installation, loaders, writers, sources, formats, and tile-specific data behavior."
  tone="violet"
/>

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
