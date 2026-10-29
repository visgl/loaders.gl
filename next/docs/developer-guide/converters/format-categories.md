Converter guide · data shapes

# Name the shape before you choose the converter.

loaders.gl uses explicit shape names to make data boundaries visible. This guide maps table, geometry, and feature-collection representations so an application can choose an output based on the next operation.

[Loader categories](https://loaders.gl/next/docs/developer-guide/loader-categories.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/loader-categories.md)[Feature collection converters](https://loaders.gl/next/docs/developer-guide/converters/feature-collection-converters.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/converters/feature-collection-converters.md)[Table category](https://loaders.gl/next/docs/specifications/category-table.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/specifications/category-table.md)

A practical map

## Same data, different working shapes.

Arrow and GeoArrow keep data columnar, GeoJSON keeps feature relationships explicit, and binary feature collections keep geometry ready for rendering. Converters connect those shapes without hiding the trade-off.

01

Tables

Typed columns, row objects, or column-oriented wrappers

02

Geometry

GeoJSON objects, WKB, WKT, TWKB, or GeoArrow encodings

03

Render output

Points, lines, and polygons with typed offsets and positions

04

Selection rule

Choose the shape that matches the next consumer

Detailed guide

## Shape names and mappings

The tables below define the public shape names and explain how multi-geometries and GeometryCollections map into render families.

The converters connect a few distinct format families. Keeping those families straight makes the API much easier to reason about.

## Table Shapes[​](#table-shapes "Direct link to Table Shapes")

| Shape              | Family                   | Notes                                       |
| ------------------ | ------------------------ | ------------------------------------------- |
| `arrow`            | Apache Arrow             | Raw Arrow `Table`                           |
| `arrow-table`      | loaders.gl table wrapper | Arrow-backed wrapper shape                  |
| `object-row-table` | loaders.gl table wrapper | row objects                                 |
| `array-row-table`  | loaders.gl table wrapper | row arrays                                  |
| `columnar-table`   | loaders.gl table wrapper | column-oriented wrapper                     |
| `geojson-table`    | loaders.gl table wrapper | rows with GeoJSON-style geometry/properties |
| `geoarrow`         | GeoArrow table           | Arrow table with GeoArrow geometry metadata |

## Geometry Formats[​](#geometry-formats "Direct link to Geometry Formats")

| Shape              | Family            | Notes                      |
| ------------------ | ----------------- | -------------------------- |
| `geojson-geometry` | GeoJSON           | single geometry object     |
| `wkb`              | wire format       | binary                     |
| `wkt`              | wire format       | text                       |
| `twkb`             | wire format       | compact binary             |
| `geoarrow.wkb`     | GeoArrow encoding | WKB stored in Arrow column |
| `geoarrow.wkt`     | GeoArrow encoding | WKT stored in Arrow column |

## Native GeoArrow Encodings[​](#native-geoarrow-encodings "Direct link to Native GeoArrow Encodings")

| Shape                         | Meaning                            |
| ----------------------------- | ---------------------------------- |
| `geoarrow.point`              | native point column                |
| `geoarrow.linestring`         | native linestring column           |
| `geoarrow.polygon`            | native polygon column              |
| `geoarrow.multipoint`         | native multipoint column           |
| `geoarrow.multilinestring`    | native multilinestring column      |
| `geoarrow.multipolygon`       | native multipolygon column         |
| `geoarrow.geometry`           | dense union over geometry families |
| `geoarrow.geometrycollection` | GeometryCollection encoding        |

## Feature Collection Shapes[​](#feature-collection-shapes "Direct link to Feature Collection Shapes")

| Shape                             | Family                    | Notes                          |
| --------------------------------- | ------------------------- | ------------------------------ |
| `geojson`                         | object model              | standard feature collections   |
| `flat-geojson`                    | flattened geometry model  | still feature-oriented         |
| `binary-feature-collection`       | render model              | points/lines/polygons bins     |
| `arrow-binary-feature-collection` | Arrow-backed render model | Arrow wrapper over binary bins |

## How Multi-Geometries Map[​](#how-multi-geometries-map "Direct link to How Multi-Geometries Map")

| Geometry                        | Render family |
| ------------------------------- | ------------- |
| `Point`, `MultiPoint`           | `points`      |
| `LineString`, `MultiLineString` | `lines`       |
| `Polygon`, `MultiPolygon`       | `polygons`    |

This mapping is why binary feature collections are family-based rather than geometry-class-based.

## How GeometryCollection Maps[​](#how-geometrycollection-maps "Direct link to How GeometryCollection Maps")

`GeometryCollection` does not get its own render bin.

Instead it is flattened into the existing families:

* point members -> `points`
* line members -> `lines`
* polygon members -> `polygons`

The source feature or row identity is preserved in the id arrays.
