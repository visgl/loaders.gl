GeoArrow geometry utility

![](/next/images/format-logos/apache-arrow-logo.png)

# triangulateWKBGeometryColumn

`triangulateWKBGeometryColumn` converts Polygon and MultiPolygon WKB values into Arrow columns for triangle indexes and source XY vertices, keeping one output row aligned with each input geometry.

[Arrow module](https://loaders.gl/next/docs/modules/tables/arrow.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/arrow.md)[GeoArrow module](https://loaders.gl/next/docs/modules/core/geoarrow.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core/geoarrow.md)[GeoArrow format](https://loaders.gl/next/docs/modules/tables/arrow/formats/geoarrow.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/arrow/formats/geoarrow.md)

The geometry path

## Decode geometry. Tessellate rings. Return aligned columns.

The helper keeps the geometry column in Arrow form while making its polygon topology easy for renderers and GPU pipelines to consume.

01

Input

Arrow Binary vector containing GeoArrow WKB

02

Geometry

Polygon and MultiPolygon values

03

Output

Triangle indexes plus XY vertices

04

Nulls

Null input rows remain null output rows

`triangulateWKBGeometryColumn` tessellates a GeoArrow WKB geometry column and returns two Apache Arrow columns: triangle vertex indexes and the source XY vertices.

The helper accepts Polygon and MultiPolygon WKB values. Each output row matches the corresponding input geometry row. Null input rows produce null output rows.

Detailed guide

## Geometry and output details

The reference below covers input vectors, output column types, row alignment, null behavior, and worker usage.

## Usage[​](#usage "Direct link to Usage")

```
import {triangulateWKBGeometryColumn} from '@loaders.gl/tables/arrow';



const {vertexIndices, vertices} = triangulateWKBGeometryColumn(geometryColumn);
```

## API[​](#api "Direct link to API")

```
triangulateWKBGeometryColumn(geometryColumn);
```

`geometryColumn` is an Apache Arrow JS `Vector<Binary>` containing GeoArrow WKB geometry values.

Returns an object with:

| Field           | Type                                      | Description                                       |
| --------------- | ----------------------------------------- | ------------------------------------------------- |
| `vertexIndices` | `Vector<List<Int32>>`                     | Triangle indexes into the matching `vertices` row |
| `vertices`      | `Vector<List<FixedSizeList[2]<Float64>>>` | XY source vertices, preserving WKB vertex order   |

## Worker API[​](#worker-api "Direct link to Worker API")

`triangulateWKBColumnOnWorker` runs the same operation on the triangulation worker. It accepts a structured-cloneable Arrow `Data` payload and returns serialized Arrow data for the two output columns.
