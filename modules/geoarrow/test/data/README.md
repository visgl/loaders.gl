# Data File Licenses

- `dictionary.arrow`, `simple.arrow`, `struct.arrow` - Apache 2 License (copied from https://github.com/wesm/arrow-1)

- `biogrid-nodes.arrow` - from graphistry.

## geoarrow

The following vendored files were copied from the GeoArrow project’s sample-data repository:

- Source repository: [geoarrow/geoarrow-data](https://github.com/geoarrow/geoarrow-data)
- Source tag: `v0.2.0`
- Source directory: [`example/files`](https://github.com/geoarrow/geoarrow-data/tree/v0.2.0/example/files)

Vendored sample files:

- `example_point.arrow` from `example_point.arrows`
- `example_linestring.arrow` from `example_linestring.arrows`
- `example_polygon.arrow` from `example_polygon.arrows`
- `example_multipolygon.arrow` from `example_multipolygon.arrows`
- `example_geometrycollection_wkb.arrow` from `example_geometrycollection_wkb.arrows`
- `example_point_zm.arrow` from `example_point-zm.arrows`

These are small upstream GeoArrow fixtures used for example-picker coverage across multiple
geometry encodings and dimensionality cases.

```sh
ogr2ogr point_wkb.arrow point.arrow -f Arrow -lco COMPRESSION=NONE -lco GEOMETRY_ENCODING=WKB
ogr2ogr line_wkb.arrow line.arrow -f Arrow -lco COMPRESSION=NONE -lco GEOMETRY_ENCODING=WKB
ogr2ogr polygon_wkb.arrow polygon.arrow -f Arrow -lco COMPRESSION=NONE -lco GEOMETRY_ENCODING=WKB
ogr2ogr multipolygon_wkb.arrow multipolygon.arrow -f Arrow -lco COMPRESSION=NONE -lco GEOMETRY_ENCODING=WKB
ogr2ogr multipolygon_hole_wkb.arrow multipolygon_hole.arrow -f Arrow -lco COMPRESSION=NONE -lco GEOMETRY_ENCODING=WKB


ogr2ogr point_wkt.arrow point.arrow -f Arrow -lco COMPRESSION=NONE -lco GEOMETRY_ENCODING=WKT
ogr2ogr line_wkt.arrow line.arrow -f Arrow -lco COMPRESSION=NONE -lco GEOMETRY_ENCODING=WKT
ogr2ogr polygon_wkt.arrow polygon.arrow -f Arrow -lco COMPRESSION=NONE -lco GEOMETRY_ENCODING=WKT
ogr2ogr multipolygon_wkt.arrow multipolygon.arrow -f Arrow -lco COMPRESSION=NONE -lco GEOMETRY_ENCODING=WKT
ogr2ogr multipolygon_hole_wkt.arrow multipolygon_hole.arrow -f Arrow -lco COMPRESSION=NONE -lco GEOMETRY_ENCODING=WKT
```
