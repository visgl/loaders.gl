import {TileDocsTabs} from '@site/src/components/docs/tile-docs-tabs';

# MapLibre Tile (MLT)

<TileDocsTabs active="mlt" />

- _[MapLibre Tile format](https://github.com/maplibre/mlt)_
- _[@loaders.gl/mlt](/docs/modules/mlt)_
- _[MLTLoader](/docs/modules/mlt/api-reference/mlt-loader)_
- _[MLTSourceLoader](/docs/modules/mlt/api-reference/mlt-source-loader)_
- _[MLT example](/examples/tiles/mlt)_

A MapLibre Tile (MLT) file is a binary geospatial tile format used by vector tile services and tooling.

The format stores one or more named feature tables, each containing geometry and attributes for a tile.
`MLTLoader` decodes these tables into GeoJSON tables, or binary geometry data when `shape: 'binary-geometry'` is selected.

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
