# GeoArrow Converters

GeoArrow conversions split into two jobs:

1. table-shape conversion
2. geometry-encoding conversion

## GeoArrowTableConverter

| Field | Value |
| --- | --- |
| Package | `@loaders.gl/geoarrow` |
| `id` | `'geoarrow-table'` |
| `from` | `'geoarrow'`, `'object-row-table'`, `'array-row-table'`, `'columnar-table'`, `'geojson-table'`, `'arrow-table'` |
| `to` | `'geoarrow'`, `'object-row-table'`, `'array-row-table'`, `'columnar-table'`, `'geojson-table'`, `'arrow-table'` |
| Detection | Arrow tables whose schema carries GeoArrow metadata |
| Typical use | Move a GeoArrow table into or out of wrappers without changing geometry encoding |

## GeoArrowGeometryConverter

| Field | Value |
| --- | --- |
| Package | `@loaders.gl/geoarrow` |
| `id` | `'geoarrow-geometry'` |
| `from` | `'geoarrow'` |
| `to` | `'geoarrow.geometry'`, `'geoarrow.geometrycollection'`, `'geoarrow.wkb'`, `'geoarrow.wkt'`, native point/line/polygon encodings |
| Detection | Arrow tables whose schema carries GeoArrow metadata |
| Typical use | Rewrite one or more geometry columns to a concrete GeoArrow encoding |

## Supported Targets

| Target | Notes |
| --- | --- |
| `geoarrow.wkb` | Simple, portable binary geometry storage |
| `geoarrow.wkt` | Human-readable geometry text |
| `geoarrow.point` / `geoarrow.linestring` / `geoarrow.polygon` | Native GeoArrow scalar encodings |
| `geoarrow.multipoint` / `geoarrow.multilinestring` / `geoarrow.multipolygon` | Native GeoArrow multi-geometry encodings |
| `geoarrow.geometry` | Dense union over native geometry families |
| `geoarrow.geometrycollection` | GeometryCollection storage |

## GeometryCollection Support

`GeoArrowGeometryConverter` now supports:

- `geoarrow.geometry`
- `geoarrow.geometrycollection`
- conversions between those shapes and WKB/WKT/native GeoArrow encodings

This matters because `GeometryCollection` is the one place where mixed geometry families are structurally expected rather than accidental.

## Multi-Geometry Mapping

Multi-geometries stay multi-geometries when the target encoding supports them:

| Source geometry | Native GeoArrow target |
| --- | --- |
| `MultiPoint` | `geoarrow.multipoint` |
| `MultiLineString` | `geoarrow.multilinestring` |
| `MultiPolygon` | `geoarrow.multipolygon` |

If the target is `geoarrow.geometry`, each row becomes a dense-union value tagged with the concrete geometry family.

If the target is `geoarrow.geometrycollection`, each row becomes a list of heterogeneous geometry union values.

## Column Selection

`convertGeoArrowGeometry()` can target:

- one column with `geometryColumn`
- several named columns with `geometryColumns`
- all geometry columns by default

## Example

```ts
import {convertGeoArrowGeometry} from '@loaders.gl/geoarrow';

const wkbTable = convertGeoArrowGeometry(geoarrowTable, 'geoarrow.wkb');
const mixedTable = convertGeoArrowGeometry(geoarrowTable, 'geoarrow.geometrycollection', {
  geometryColumns: ['geometry', 'centroid']
});
```
