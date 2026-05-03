# Render Converters

These APIs skip generic shape dispatch and produce render-oriented GIS structures directly.

## Direct Geometry Column To BinaryFeatureCollection

| API | Package | Input | Output |
| --- | --- | --- | --- |
| `convertGeometryColumnToBinaryFeatureCollection()` | `@loaders.gl/gis` | table + geometry column | `BinaryFeatureCollection` |
| `convertGeometryValuesToBinaryFeatureCollection()` | `@loaders.gl/gis` | geometry value list | `BinaryFeatureCollection` |

## Supported Inputs

The direct geometry-column path supports:

- WKB geometry columns
- WKT geometry columns
- native GeoArrow point, line, and polygon columns through `GeoArrowLayer`
- GeoArrow WKB and WKT columns through the same render path

## Advanced Support

### Mixed geometry families

One input column can contain a mixture of:

- points
- lines
- polygons

The output still lands in one `BinaryFeatureCollection`, split into the existing `points`, `lines`, and `polygons` bins.

### GeometryCollection

For WKB and WKT inputs, `GeometryCollection` is supported and flattened recursively into the same bins.

That means:

- one row can contribute to multiple output bins
- the original row index is preserved as the global feature id
- point, line, and polygon members can all render from the same source column

### Multi-geometries

Multi-geometries are mapped by family:

| Input geometry | Output bin effect |
| --- | --- |
| `MultiPoint` | multiple point vertices in `points` |
| `MultiLineString` | multiple paths in `lines` |
| `MultiPolygon` | multiple polygon objects and rings in `polygons` |

### Scratch reuse

`GeometryColumnBinaryFeatureCollectionScratch` lets callers reuse caller-owned typed arrays across conversions.

The conversion flow is:

1. measure counts
2. grow scratch arrays only when capacity is insufficient
3. fill the exact used ranges
4. return subarray views

## Triangulation

Polygon output matches the existing binary polygon contract:

- `positions`
- `polygonIndices`
- `primitivePolygonIndices`
- `triangles`

The converter triangulates polygons directly for rendering. This is the key path that lets WKB/WKT-backed GeoArrow tables render without a GeoJSON detour.

## ArrowBinaryFeatureCollection

The Arrow-backed wrapper adds an Arrow view over a `BinaryFeatureCollection`:

| API | Input | Output |
| --- | --- | --- |
| `convertBinaryFeatureCollectionToArrowBinaryFeatureCollection()` | `BinaryFeatureCollection` | `ArrowBinaryFeatureCollection` |
| `convertArrowBinaryFeatureCollectionToBinaryFeatureCollection()` | `ArrowBinaryFeatureCollection` | `BinaryFeatureCollection` |

### Why wrap it in Arrow?

The binary feature format already uses offset arrays that map naturally to Arrow nested list columns.

This wrapper keeps the same family split:

- `points`
- `lines`
- `polygons`

and exposes each family as an Arrow table.

### Polygon note

Polygon Arrow wrapping carries both:

- nested Arrow geometry for natural inspection
- raw `polygonIndices` sidecar for exact round-tripping back to loaders.gl binary

This avoids regenerating polygon object offsets on the reverse conversion path.

## GeoArrowLayer

`GeoArrowLayer` uses these render-oriented utilities when it sees:

- native GeoArrow point/line/polygon encodings
- GeoArrow WKB/WKT columns
- mixed-family WKB/WKT rows
- `GeometryCollection` members inside WKB/WKT rows

That is what lets examples render GeoArrow data directly while still reporting whether the example loaded `geoarrow` or `geojson`.
