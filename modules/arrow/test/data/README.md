# Data File Licenses

- `dictionary.arrow`, `simple.arrow`, `struct.arrow` - Apache 2 License (copied from https://github.com/wesm/arrow-1)

- `biogrid-nodes.arrow` - from graphistry.


## geoarrow

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