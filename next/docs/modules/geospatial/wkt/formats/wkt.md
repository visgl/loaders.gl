Geometry text format

![](/next/images/format-logos/ogc-mark.svg)OGCWKT

# Make a geometry readable at a glance.

Well-Known Text (WKT) represents points, lines, polygons, collections, and coordinate dimensions as text. It is useful for inspection, interchange, and database-facing workflows.

[WKT module](https://loaders.gl/next/docs/modules/geospatial/wkt.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/wkt.md)[WKTLoader](https://loaders.gl/next/docs/modules/geospatial/wkt/api-reference/wkt-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/wkt/api-reference/wkt-loader.md)

The geometry vocabulary

## Name the geometry, then list its coordinates.

WKT makes the topological shape explicit before the coordinate sequence. Use WKB when the same geometry needs a compact binary representation, or GeoJSON when application interoperability is the priority.

01

Shape

Point, line, polygon, or a collection

02

Dimensions

XY, XYZ, XYM, or XYZM coordinate values

03

Reference

WKT geometry is distinct from WKT CRS

04

Alternative

WKB for binary storage, GeoJSON for JSON APIs

* [OGC Standard](https://www.ogc.org/standard/sfa/) - See Section 7.
* [Wikipedia](https://en.wikipedia.org/wiki/Well-known_text_representation_of_geometry)

Well-known text (WKT) for geometry is a text markup language for representing vector geometry objects. It is specified in the OGC Simple Feature Access standard (ISO/IEC 13249-3:2016).

Detailed guide

## WKT syntax and geometry support

The sections below cover standards references, examples, dimensional variants, alternatives, and the geometry families supported by loaders.gl.

* WKT should not be confused with [WKT CRS](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/wkt-crs.md) which describes spatial reference systems.
* WKT has a binary equivalent, well-known binary [WKB](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/wkb.md), which is a more compact, but non human-readable form.

## Examples[​](#examples "Direct link to Examples")

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

## Variants[​](#variants "Direct link to Variants")

| Format | Support | Description                                        |
| ------ | ------- | -------------------------------------------------- |
| EWKT   | ✕       | WKT that starts with a spatial reference id (SRID) |

## Alternatives[​](#alternatives "Direct link to Alternatives")

| Format           | Notes                                                               |
| ---------------- | ------------------------------------------------------------------- |
| WKT              | (This format) Arguably the easiest for humans to read.              |
| WKB              | Binary, more compact                                                |
| GeoJSON Geometry | JSON based, human-readable, slightly more verbose, easier to parse  |
| GML Geometry     | XML based, human-readable, even more verbose, more complex to parse |

## Ecosystem Support[​](#ecosystem-support "Direct link to Ecosystem Support")

* PostGIS and some other databases offer functions to return geometries in WKT format: [WKT](https://postgis.net/docs/ST_AsText.html), [ST\_AsEWKT](https://postgis.net/docs/ST_AsEWKT.html).

## Geometries[​](#geometries "Direct link to Geometries")

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
