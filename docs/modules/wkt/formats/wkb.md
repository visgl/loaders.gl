---
title: WKB - Well-Known Binary
description: Represent vector geometry as compact, typed binary records.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Geometry binary format"
  title="Carry geometry without paying for readable text."
  description="Well-Known Binary (WKB) is the compact binary counterpart to WKT. Its header identifies byte order and geometry type before the coordinate records, making it useful for storage and transport in GIS pipelines."
  tone="orange"
  meta={['OGC geometry', 'Compact binary', 'XY / Z / M / ZM']}
  links={[
    {label: 'WKT module', to: '/docs/modules/wkt'},
    {label: 'WKB loader', to: '/docs/modules/wkt/api-reference/wkb-loader'},
    {label: 'WKT-CRS', to: '/docs/modules/wkt/formats/wkt-crs'}
  ]}
/>

<DocOrientation
  eyebrow="The WKB record path"
  title="Read byte order. Identify the geometry. Decode its coordinate records."
  description="WKB keeps geometry compact while retaining the type and dimensionality needed to reconstruct points, lines, polygons, and collections. Spatial reference metadata is a separate concern."
  tone="orange"
  items={[
    {label: 'Header', value: 'Byte order and 32-bit geometry type'},
    {label: 'Shape', value: 'Point, line, polygon, multiparts, and collections'},
    {label: 'Dimensions', value: 'XY, XYZ, XYM, and XYZM variants'},
    {label: 'Alternative', value: 'WKT for readable text; GeoJSON for JSON APIs'}
  ]}
/>

![ogc-logo](../../../images/logos/ogc-logo-60.png)

- _[`@loaders.gl/wkt`](/docs/modules/wkt)_

Well-Known Binary (WKB) is a binary version of Well-known Text

<ReferenceBoundary
  title="WKB layout and compatibility details"
  description="The reference below covers byte order, geometry type codes, dimensional variants, supported shapes, alternatives, and loader support."
  tone="orange"
/>

## Overview

Well-known binary (WKB) representations are typically shown in hexadecimal strings.

## Variations

- EKWB - Adds spatial reference systems
- TWKB

## Alternatives

- WKT
- GeoJSON Geometry
- GML Geometry

| Format | Support | Description                          |
| ------ | ------- | ------------------------------------ |
| WKB    | ❌      |                                      |
| TWKB   | ❌      | WKB variant reduces binary size ~2x. |

TWKB uses varints, precision truncation and zigzag point encoding to reduce binary size ~2x (however compressed size reduction is less)

## Version History

TBA.

## Ecosystem Support

- PostGIS offers a function to return geometries in TWKB format: [ST_AsTWKB](https://postgis.net/docs/ST_AsTWKB.html).

## Format Details

The first byte indicates the byte order for the data:

- 00 : big endian
- 01 : little endian

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
| `CircularString`     | ❌        | 0008 | 1008 | 2008 | 3008 |
| `CompoundCurve`      | ❌        | 0009 | 1009 | 2009 | 3009 |
| `CurvePolygon`       | ❌        | 0010 | 1010 | 2010 | 3010 |
| `MultiCurve`         | ❌        | 0011 | 1011 | 2011 | 3011 |
| `MultiSurface`       | ❌        | 0012 | 1012 | 2012 | 3012 |
| `Curve`              | ❌        | 0013 | 1013 | 2013 | 3013 |
| `Surface`            | ❌        | 0014 | 1014 | 2014 | 3014 |
| `PolyhedralSurface`  | ❌        | 0015 | 1015 | 2015 | 3015 |
| `TIN`                | ❌        | 0016 | 1016 | 2016 | 3016 |
| `Triangle`           | ❌        | 0017 | 1017 | 2017 | 3017 |
| `Circle`             | ❌        | 0018 | 1018 | 2018 | 3018 |
| `GeodesicString`     | ❌        | 0019 | 1019 | 2019 | 3019 |
| `EllipticalCurve`    | ❌        | 0020 | 1020 | 2020 | 3020 |
| `NurbsCurve`         | ❌        | 0021 | 1021 | 2021 | 3021 |
| `Clothoid`           | ❌        | 0022 | 1022 | 2022 | 3022 |
| `SpiralCurve`        | ❌        | 0023 | 1023 | 2023 | 3023 |
| `CompoundSurface`    | ❌        | 0024 | 1024 | 2024 | 3024 |
| `BrepSolid`          | ❌        |      | 1025 |      |      |
| `AffinePlacement`    | ❌        | 102  | 1102 |      |      |

Remarks:

- _Many implementations, including loaders.gl, only handle the core GeoJSON geometry equivalents (points, line strings, polygons and to a varying degrees geometry collections of the same)._
- _`GeometryCollection`_ can be difficult for some clients to handle.
