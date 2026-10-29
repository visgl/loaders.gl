WKT module · geometry writer

![](/next/images/format-logos/ogc-mark.svg)OGCWKB

# TWKBWriter

Encode structured geometry as Tiny Well-Known Binary when a compact binary representation is more useful than readable WKT or general-purpose WKB.

[TWKB format](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/twkb.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/twkb.md)[TWKBLoader](https://loaders.gl/next/docs/modules/geospatial/wkt/api-reference/twkb-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/wkt/api-reference/twkb-loader.md)[WKT module](https://loaders.gl/next/docs/modules/geospatial/wkt.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/wkt.md)

What it writes

## Turn structured geometry into transport-sized bytes.

The writer accepts GeoJSON-style geometry, applies the selected dimensional flags, and emits TWKB bytes that can be stored or sent to a service implementing the TWKB specification.

01

Input

GeoJSON-style point, line, polygon, or collection

02

Dimensions

XY, XYZ, XYM, or XYZM through writer options

03

Output

ArrayBuffer containing TWKB

04

APIs

encode and encodeSync

Detailed guide

## TWKBWriter reference

The sections below document installation, usage, dimensional options, and the compact format summary.

![From-v4.0](https://img.shields.io/badge/From-v4.0-blue.svg?style=flat-square)

Writer for the [Tiny Well-known binary](https://en.wikipedia.org/wiki/Well-known_text_representation_of_geometry#Well-known_binary) format for representation of geometry.

| TWKBWriter     |                                                                                                                      |
| -------------- | -------------------------------------------------------------------------------------------------------------------- |
| File Extension | `.wkb`,                                                                                                              |
| File Type      | Binary                                                                                                               |
| File Format    | [Tiny Well Known Binary](https://en.wikipedia.org/wiki/Well-known_text_representation_of_geometry#Well-known_binary) |
| Data Format    | [Geometry](https://loaders.gl/next/docs/specifications/category-gis.md)                                         |
| Supported APIs | `encode`, `encodeSync`                                                                                               |
| Encoder Type   | Synchronous                                                                                                          |
| Worker Thread  | ✅ Yes                                                                                                               |

## Installation[​](#installation "Direct link to Installation")

```
npm install @loaders.gl/geospatial

npm install @loaders.gl/core
```

## Usage[​](#usage "Direct link to Usage")

```
import {TWKBWriter} from '@loaders.gl/geospatial/wkt';

import {encodeSync} from '@loaders.gl/core';



const geometry = {

  type: 'Polygon',

  coordinates: [

    [

      [1, 2],

      [3, 4],

      [5, 6],

      [1, 2]

    ]

  ]

};

const arrayBuffer = encodeSync(geometry, TWKBWriter, {twkb: {hasZ: false, hasM: false}});
```

## Options[​](#options "Direct link to Options")

* `hasZ`: Should be `true` if the GeoJSON input has Z values. These values are expected to be the third coordinate position.
* `hasM`: Should be `true` if the GeoJSON input has M values. Thes are expected to be the third coordinate position if Z values do not exist, or fourth if Z values do exist.

## Format Summary[​](#format-summary "Direct link to Format Summary")

Well-known binary (TWKB) is a binary geometry encoding to store geometries (it doesn't store attributes). It's used in databases such as PostGIS and as the internal storage format of Shapefiles. It's also being discussed as the internal storage format for a ["GeoArrow"](https://github.com/geopandas/geo-arrow-spec) specification. TWKB is defined starting on page 62 of the [OGC Simple Features specification](http://portal.opengeospatial.org/files/?artifact_id=25355).

* Coordinates can be 2-4 dimensions and are interleaved.
* Positions stored as double precision

![image](https://user-images.githubusercontent.com/15164633/83707157-90413b80-a5d6-11ea-921c-b04208942e79.png)
