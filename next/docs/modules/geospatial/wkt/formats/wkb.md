Geometry binary format

![](/next/images/format-logos/ogc-mark.svg)OGCWKB

# Carry geometry without paying for readable text.

Well-Known Binary (WKB) is the compact binary counterpart to WKT. Its header identifies byte order and geometry type before the coordinate records, making it useful for storage and transport in GIS pipelines.

[WKT module](https://loaders.gl/next/docs/modules/geospatial/wkt.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/wkt.md)[WKB loader](https://loaders.gl/next/docs/modules/geospatial/wkt/api-reference/wkb-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/wkt/api-reference/wkb-loader.md)[WKT-CRS](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/wkt-crs.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/wkt-crs.md)

The WKB record path

## Read byte order. Identify the geometry. Decode its coordinate records.

WKB keeps geometry compact while retaining the type and dimensionality needed to reconstruct points, lines, polygons, and collections. Spatial reference metadata is a separate concern.

01

Header

Byte order and 32-bit geometry type

02

Shape

Point, line, polygon, multiparts, and collections

03

Dimensions

XY, XYZ, XYM, and XYZM variants

04

Alternative

WKT for readable text; GeoJSON for JSON APIs

* *[`@loaders.gl/geospatial/wkt`](https://loaders.gl/next/docs/modules/geospatial/wkt.md)*

Well-Known Binary (WKB) is a binary version of Well-known Text

Detailed guide

## WKB layout and compatibility details

The reference below covers byte order, geometry type codes, dimensional variants, supported shapes, alternatives, and loader support.

## Overview[​](#overview "Direct link to Overview")

Well-known binary (WKB) representations are typically shown in hexadecimal strings.

## Variations[​](#variations "Direct link to Variations")

* EKWB - Adds spatial reference systems
* TWKB

## Alternatives[​](#alternatives "Direct link to Alternatives")

* WKT
* GeoJSON Geometry
* GML Geometry

| Format | Support | Description                           |
| ------ | ------- | ------------------------------------- |
| WKB    | ✕       |                                       |
| TWKB   | ✕       | WKB variant reduces binary size \~2x. |

TWKB uses varints, precision truncation and zigzag point encoding to reduce binary size \~2x (however compressed size reduction is less)

## Version context[​](#version-context "Direct link to Version context")

The core WKB geometry layout is defined by the OGC Simple Feature Access family of standards and is also widely implemented by spatial databases such as PostGIS. Extended type codes add Z, M, and CRS dimensions without changing the basic byte-order and geometry-record structure. The loaders.gl WKB path focuses on the core point, line, polygon, multipart, and collection types listed in the support table below.

## Ecosystem Support[​](#ecosystem-support "Direct link to Ecosystem Support")

* PostGIS offers a function to return geometries in TWKB format: [ST\_AsTWKB](https://postgis.net/docs/ST_AsTWKB.html).

## Format Details[​](#format-details "Direct link to Format Details")

The first byte indicates the byte order for the data:

* 00 : big endian
* 01 : little endian

The next 4 bytes are a 32-bit unsigned integer for the geometry type, as described below:

| Type                 | Supported | 2D   | Z    | M    | ZM   |
| -------------------- | --------- | ---- | ---- | ---- | ---- |
| `Geometry`           | ✅        | 0000 | 1000 | 2000 | 3000 |
| `Point`              | ✅        | 0001 | 1001 | 2001 | 3001 |
| `LineString`         | ✅        | 0002 | 1002 | 2002 | 3002 |
| `Polygon`            | ✅        | 0003 | 1003 | 2003 | 3003 |
| `MultiPoint`         | ✅        | 0004 | 1004 | 2004 | 3004 |
| `MultiLineString`    | ✅        | 0005 | 1005 | 2005 | 3005 |
| `MultiPolygon`       | ✅        | 0006 | 1006 | 2006 | 3006 |
| `GeometryCollection` | ✅ \*     | 0007 | 1007 | 2007 | 3007 |
|                      |           |      |      |      |      |
| `CircularString`     | ✕         | 0008 | 1008 | 2008 | 3008 |
| `CompoundCurve`      | ✕         | 0009 | 1009 | 2009 | 3009 |
| `CurvePolygon`       | ✕         | 0010 | 1010 | 2010 | 3010 |
| `MultiCurve`         | ✕         | 0011 | 1011 | 2011 | 3011 |
| `MultiSurface`       | ✕         | 0012 | 1012 | 2012 | 3012 |
| `Curve`              | ✕         | 0013 | 1013 | 2013 | 3013 |
| `Surface`            | ✕         | 0014 | 1014 | 2014 | 3014 |
| `PolyhedralSurface`  | ✕         | 0015 | 1015 | 2015 | 3015 |
| `TIN`                | ✕         | 0016 | 1016 | 2016 | 3016 |
| `Triangle`           | ✕         | 0017 | 1017 | 2017 | 3017 |
| `Circle`             | ✕         | 0018 | 1018 | 2018 | 3018 |
| `GeodesicString`     | ✕         | 0019 | 1019 | 2019 | 3019 |
| `EllipticalCurve`    | ✕         | 0020 | 1020 | 2020 | 3020 |
| `NurbsCurve`         | ✕         | 0021 | 1021 | 2021 | 3021 |
| `Clothoid`           | ✕         | 0022 | 1022 | 2022 | 3022 |
| `SpiralCurve`        | ✕         | 0023 | 1023 | 2023 | 3023 |
| `CompoundSurface`    | ✕         | 0024 | 1024 | 2024 | 3024 |
| `BrepSolid`          | ✕         |      | 1025 |      |      |
| `AffinePlacement`    | ✕         | 102  | 1102 |      |      |

Remarks:

* *Many implementations, including loaders.gl, only handle the core GeoJSON geometry equivalents (points, line strings, polygons and to a varying degrees geometry collections of the same).*
* *`GeometryCollection`* can be difficult for some clients to handle.
