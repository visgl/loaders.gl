# WKT - Well-Known Text

![ogc-logo](../../../images/logos/ogc-logo-60.png)

- [OGC Standard](https://www.ogc.org/standard/sfa/) - See Section 7.
- [Wikipedia](https://en.wikipedia.org/wiki/Well-known_text_representation_of_geometry)

Well-known text (WKT) for geometry is a text markup language for representing vector geometry objects. It is specified in the OGC Simple Feature Access standard (ISO/IEC 13249-3:2016).

- WKT should not be confused with [WKT CRS](./wkt-crs) which describes spatial reference systems. 
- WKT has a binary equivalent, well-known binary [WKB](./wkb), which is a more compact, but non human-readable form. 

## Examples

| Geometry Type      | WKT Example                                                                       | Description                                             |
| ------------------ | --------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Point              | `POINT(30 10)`                                                                    | A single point with x coordinate 30 and y coordinate 10 |
| LineString         | `LINESTRING(30 10, 10 30, 40 40)`                                                 | A line connecting three points with x and y coordinates |
| Polygon            | `POLYGON((30 10, 40 40, 20 40, 10 20, 30 10))`                                    | A polygon with five vertices and an interior ring       |
| MultiPoint         | `MULTIPOINT((10 40), (40 30), (20 20), (30 10))`                                  | Four points with x and y coordinates                    |
| MultiLineString    | `MULTILINESTRING((10 10, 20 20, 10 40), (40 40, 30 30, 40 20, 30 10))`            | Ttwo line strings, each connecting multiple points      |
| MultiPolygon       | `MULTIPOLYGON(((30 20, 45 40, 10 40, 30 20)),((15 5, 40 10, 10 20, 5 10, 15 5)))` | Two polygons                                            |
| GeometryCollection | `GEOMETRYCOLLECTION(POINT(10 40), LINESTRING(30 10, 10 30, 40 40)`                | A collection of geometries                              |
| Point ZM           | `POINT ZM (1 2 3 4)`                                                              | A point with x, y, z, and m values of 1, 2, 3, and 4    |
| Point M            | `POINT M (1 2 3)`                                                                 | A point with x, y, and m values of 1, 2, and 3          |

## Variants

| Format | Support | Description                                        |
| ------ | ------- | -------------------------------------------------- |
| EWKT   | ❌       | WKT that starts with a spatial reference id (SRID) |


## Alternatives

| Format           | Notes                                                               |
| ---------------- | ------------------------------------------------------------------- |
| WKT              | (This format) Arguably the easiest for humans to read.              |
| WKB              | Binary, more compact                                                |
| GeoJSON Geometry | JSON based, human-readable, slightly more verbose, easier to parse  |
| GML Geometry     | XML based, human-readable, even more verbose, more complex to parse |

## Ecosystem Support

- PostGIS and some other databases offer functions to return geometries in WKT format: [WKT](https://postgis.net/docs/ST_AsText.html), [ST_AsEWKT](https://postgis.net/docs/ST_AsEWKT.html).

## Geometries

WKT can represent a range of distinct geometric objects.

*Note that some implementations, including loaders.gl, only handle the core GeoJSON geometry equivalents (points, line strings, polygons and to a varying degrees geometry collections of the same).*

| Geometry                               |
| -------------------------------------- |
| `Point`, `MultiPoint`                  |
| `LineString`, `MultiLineString`        |
| `Polygon`, `MultiPolygon`              |
| `GeometryCollection`                   |
|                                        |
| `Triangle`                             |
| `PolyhedralSurface`                    |
| `TIN` (Triangulated irregular network) |

