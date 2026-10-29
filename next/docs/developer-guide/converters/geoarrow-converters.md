Geospatial conversion

# Change the geometry encoding without changing the table contract.

GeoArrow conversions separate table-shape conversion from geometry-encoding conversion. That lets applications choose a representation for storage, transport, analysis, or rendering while preserving the surrounding columns and metadata.

[GeoArrow format](https://loaders.gl/next/docs/modules/tables/arrow/formats/geoarrow.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/arrow/formats/geoarrow.md)[Table converters](https://loaders.gl/next/docs/developer-guide/converters/table-and-arrow-converters.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/converters/table-and-arrow-converters.md)

Two conversion jobs

## Move the wrapper, or rewrite the geometry.

A table converter changes how a table is wrapped. A geometry converter changes how its geometry columns are encoded. Keeping those operations separate makes each transformation easier to reason about.

01

Table shape

GeoArrow, Arrow, columnar, row, or GeoJSON-like wrappers

02

Geometry shape

WKB, WKT, native point/line/polygon, or unions

03

Preserves

Non-spatial columns and column-level metadata

04

Use it for

Parquet, IPC, scans, workers, rendering, and export

GeoArrow conversions split into two jobs:

1. table-shape conversion
2. geometry-encoding conversion

Detailed guide

## GeoArrow converter details

The sections below document converter contracts, supported targets, metadata behavior, and usage boundaries.

## GeoArrowTableConverter[​](#geoarrowtableconverter "Direct link to GeoArrowTableConverter")

| Field       | Value                                                                                                           |
| ----------- | --------------------------------------------------------------------------------------------------------------- |
| Package     | `@loaders.gl/core/geoarrow`                                                                                     |
| `id`        | `'geoarrow-table'`                                                                                              |
| `from`      | `'geoarrow'`, `'object-row-table'`, `'array-row-table'`, `'columnar-table'`, `'geojson-table'`, `'arrow-table'` |
| `to`        | `'geoarrow'`, `'object-row-table'`, `'array-row-table'`, `'columnar-table'`, `'geojson-table'`, `'arrow-table'` |
| Detection   | Arrow tables whose schema carries GeoArrow metadata                                                             |
| Typical use | Move a GeoArrow table into or out of wrappers without changing geometry encoding                                |

## GeoArrowGeometryConverter[​](#geoarrowgeometryconverter "Direct link to GeoArrowGeometryConverter")

| Field       | Value                                                                                                                           |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Package     | `@loaders.gl/core/geoarrow`                                                                                                     |
| `id`        | `'geoarrow-geometry'`                                                                                                           |
| `from`      | `'geoarrow'`                                                                                                                    |
| `to`        | `'geoarrow.geometry'`, `'geoarrow.geometrycollection'`, `'geoarrow.wkb'`, `'geoarrow.wkt'`, native point/line/polygon encodings |
| Detection   | Arrow tables whose schema carries GeoArrow metadata                                                                             |
| Typical use | Rewrite one or more geometry columns to a concrete GeoArrow encoding                                                            |

## Supported Targets[​](#supported-targets "Direct link to Supported Targets")

| Target                                                                       | Notes                                     |
| ---------------------------------------------------------------------------- | ----------------------------------------- |
| `geoarrow.wkb`                                                               | Simple, portable binary geometry storage  |
| `geoarrow.wkt`                                                               | Human-readable geometry text              |
| `geoarrow.point` / `geoarrow.linestring` / `geoarrow.polygon`                | Native GeoArrow scalar encodings          |
| `geoarrow.multipoint` / `geoarrow.multilinestring` / `geoarrow.multipolygon` | Native GeoArrow multi-geometry encodings  |
| `geoarrow.geometry`                                                          | Dense union over native geometry families |
| `geoarrow.geometrycollection`                                                | GeometryCollection storage                |

## Binary Polygon Buffers[​](#binary-polygon-buffers "Direct link to Binary Polygon Buffers")

`makeGeoArrowColumnFromBinaryPolygon(binaryPolygons, {dimension})` adapts an existing `BinaryPolygonGeometry` to the Arrow-independent `GeoArrowColumn` descriptor from `@math.gl/geospatial/geoarrow`. It produces one `geoarrow.polygon` row per polygon, including empty polygons. It does not reconstruct MultiPolygon grouping or original feature identity.

```
import {

  makeGeoArrowColumnFromBinaryPolygon,

  getGeoArrowRowBounds

} from '@loaders.gl/core/geoarrow';

import {getGeoArrowBounds} from '@math.gl/geospatial/geoarrow';



const column = makeGeoArrowColumnFromBinaryPolygon(binaryPolygons, {dimension: 'xym'});

const bounds = getGeoArrowBounds(column);

const polygonBounds = getGeoArrowRowBounds(binaryPolygons, {dimension: 'xym'});
```

The required `dimension` is `xy`, `xyz`, `xym`, or `xyzm` and must match `positions.size`. The adapter borrows Float32 or Float64 positions and Int32 ring offsets, including typed-array subviews. Other numeric ring-offset arrays are validated and converted to Int32. It allocates polygon-to-ring offsets because legacy `polygonIndices` point to vertices instead of rings. Keep borrowed buffers unchanged while using the descriptor.

Both index attributes must have size 1, start at zero, and include the terminal vertex count. Offsets must be ordered integers within the Int32 range, and polygon boundaries must match ring boundaries. Repeated polygon offsets preserve empty rows; use `[0]` for the ring offsets of an entirely empty geometry. Empty rings are rejected because vertex offsets cannot determine their polygon ownership. The adapter validates buffer structure, not polygon topology or ring closure; provide closed rings for GeoArrow consumers that require valid polygons.

Triangle indices, feature IDs, and properties remain on the original object. No coordinates are transformed, and no CRS is inferred. Existing loader outputs are unchanged.

## GeometryCollection Support[​](#geometrycollection-support "Direct link to GeometryCollection Support")

`GeoArrowGeometryConverter` now supports:

* `geoarrow.geometry`
* `geoarrow.geometrycollection`
* conversions between those shapes and WKB/WKT/native GeoArrow encodings

This matters because `GeometryCollection` is the one place where mixed geometry families are structurally expected rather than accidental.

## Multi-Geometry Mapping[​](#multi-geometry-mapping "Direct link to Multi-Geometry Mapping")

Multi-geometries stay multi-geometries when the target encoding supports them:

| Source geometry   | Native GeoArrow target     |
| ----------------- | -------------------------- |
| `MultiPoint`      | `geoarrow.multipoint`      |
| `MultiLineString` | `geoarrow.multilinestring` |
| `MultiPolygon`    | `geoarrow.multipolygon`    |

If the target is `geoarrow.geometry`, each row becomes a dense-union value tagged with the concrete geometry family.

If the target is `geoarrow.geometrycollection`, each row becomes a list of heterogeneous geometry union values.

## Column Selection[​](#column-selection "Direct link to Column Selection")

`convertGeoArrowGeometry()` can target:

* one column with `geometryColumn`
* several named columns with `geometryColumns`
* all geometry columns by default

## Example[​](#example "Direct link to Example")

```
import {convertGeoArrowGeometry} from '@loaders.gl/core/geoarrow';



const wkbTable = convertGeoArrowGeometry(geoarrowTable, 'geoarrow.wkb');

const mixedTable = convertGeoArrowGeometry(geoarrowTable, 'geoarrow.geometrycollection', {

  geometryColumns: ['geometry', 'centroid']

});
```

## Spatial queries[​](#spatial-queries "Direct link to Spatial queries")

`GeoArrowSpatialIndex` provides row lookup by feature ID, extent selection using cached bounds, and nearest-geometry queries with closest coordinates for snapping. See [Spatial queries beyond picking](https://loaders.gl/next/docs/developer-guide/spatial-queries.md) for examples, planar CRS requirements, and the distinction between local data queries, remote queries, and rendering picks.
