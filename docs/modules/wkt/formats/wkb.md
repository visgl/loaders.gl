# WKB - Well-Known Binary

![ogc-logo](../../../images/logos/ogc-logo-60.png)

Well-known binary

## Overview

Well-known binary (WKB) representations are typically shown in hexadecimal strings.

## Variations

- EKWB - Adds spatial reference systems
- TWKB

## Alternatives

- WKT
- GeoJSON Geometry
- GML Geometry 


| Format | Support | Description                                        |
| ------ | ------- | -------------------------------------------------- |
| EWKT   | ❌       | WKT that starts with a spatial reference id (SRID) |
| TWKB   | ❌       | WKB variant reduces binary size ~2x.               |

TWKB uses varints, precision truncation and zigzag point encoding to reduce binary size ~2x (however compressed size reduction is less)

## Encoding

The first byte indicates the byte order for the data:

- 00 : big endian
- 01 : little endian

The next 4 bytes are a 32-bit unsigned integer for the geometry type, as described below:

*Note that some implementations, including loaders.gl, only handle the core GeoJSON geometry equivalents (points, line strings, polygons and to a varying degrees geometry collections of the same).*

| Type               | 2D   | Z    | M    | ZM   |
| ------------------ | ---- | ---- | ---- | ---- |
| Geometry           | 0000 | 1000 | 2000 | 3000 |
| Point              | 0001 | 1001 | 2001 | 3001 |
| LineString         | 0002 | 1002 | 2002 | 3002 |
| Polygon            | 0003 | 1003 | 2003 | 3003 |
| MultiPoint         | 0004 | 1004 | 2004 | 3004 |
| MultiLineString    | 0005 | 1005 | 2005 | 3005 |
| MultiPolygon       | 0006 | 1006 | 2006 | 3006 |
| GeometryCollection | 0007 | 1007 | 2007 | 3007 |
|                    |
| CircularString     | 0008 | 1008 | 2008 | 3008 |
| CompoundCurve      | 0009 | 1009 | 2009 | 3009 |
| CurvePolygon       | 0010 | 1010 | 2010 | 3010 |
| MultiCurve         | 0011 | 1011 | 2011 | 3011 |
| MultiSurface       | 0012 | 1012 | 2012 | 3012 |
| Curve              | 0013 | 1013 | 2013 | 3013 |
| Surface            | 0014 | 1014 | 2014 | 3014 |
| PolyhedralSurface  | 0015 | 1015 | 2015 | 3015 |
| TIN                | 0016 | 1016 | 2016 | 3016 |
| Triangle           | 0017 | 1017 | 2017 | 3017 |
| Circle             | 0018 | 1018 | 2018 | 3018 |
| GeodesicString     | 0019 | 1019 | 2019 | 3019 |
| EllipticalCurve    | 0020 | 1020 | 2020 | 3020 |
| NurbsCurve         | 0021 | 1021 | 2021 | 3021 |
| Clothoid           | 0022 | 1022 | 2022 | 3022 |
| SpiralCurve        | 0023 | 1023 | 2023 | 3023 |
| CompoundSurface    | 0024 | 1024 | 2024 | 3024 |
| BrepSolid          |      | 1025 |      | |
| AffinePlacement    | 102  | 1102 |      | |

