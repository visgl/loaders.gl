---
title: MapLibre Tile format
description: A binary vector-tile format for named feature tables, geometry, and attributes.
hide_title: true
page_style: designed
---

import {TileDocsTabs} from '@site/src/components/docs/tile-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Binary vector-tile format"
  title="Put a tile’s geometry and attributes on one path."
  description="MapLibre Tile (MLT) is a compact binary tile format for feature tables addressed by a tile coordinate. loaders.gl decodes its named tables into reusable GeoJSON or binary geometry data."
  tone="cyan"
  meta={['MapLibre Tile', 'Binary geometry', 'Feature tables']}
  links={[
    {label: 'MLT module', to: '/docs/modules/mlt'},
    {label: 'MLT source', to: '/docs/modules/mlt/api-reference/mlt-source-loader'}
  ]}
/>

<TileDocsTabs active="mlt" />

<DocOrientation
  eyebrow="The tile boundary"
  title="Address the tile, then choose its data shape."
  description="MLT handles the binary payload inside a tile. The source or tile layer owns addressing, while the application chooses a compatible decoded representation for rendering or analysis."
  tone="cyan"
  items={[
    {label: 'Address', value: 'Z/X/Y tile coordinates'},
    {label: 'Decode', value: 'Named feature tables and geometry families'},
    {label: 'Choose', value: 'GeoJSON tables or binary geometry output'},
    {label: 'Continue', value: 'Render, analyze, or pass data to another stage'}
  ]}
/>

- _[MapLibre Tile format](https://github.com/maplibre/mlt)_
- _[@loaders.gl/mlt](/docs/modules/mlt)_
- _[MLTLoader](/docs/modules/mlt/api-reference/mlt-loader)_
- _[MLTSourceLoader](/docs/modules/mlt/api-reference/mlt-source-loader)_
- _[MLT example](/examples/tiles/mlt)_

A MapLibre Tile (MLT) file is a binary geospatial tile format used by vector tile services and tooling.

The format stores one or more named feature tables, each containing geometry and attributes for a tile.
`MLTLoader` decodes these tables into GeoJSON tables, or binary geometry data when `shape: 'binary-geometry'` is selected.

<ReferenceBoundary
  title="MLT structure and compatibility"
  description="The sections below cover addressing, file metadata, geometry families, and the shapes returned by the current decoder."
  tone="cyan"
/>

## File format

MLT tiles are typically addressed using a Z/X/Y tile coordinate scheme.

Common properties:

| Property       | Value                           |
| -------------- | ------------------------------- |
| File Extension | `.mlt`                          |
| MIME Type      | `application/vnd.maplibre-tile` |
| Container      | Binary                          |

## Geometry

MLT currently supports the core geometry families implemented by loaders.gl:

- `Point`, `MultiPoint`
- `LineString`, `MultiLineString`
- `Polygon`, `MultiPolygon`

Nested geometry collections and advanced topologies are not fully normalized in the current parser.
