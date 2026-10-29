WKT module · geometry writer

![](/next/images/format-logos/ogc-mark.svg)OGCWKB

# WKBWriter

Encode structured geometry as compact Well-Known Binary for database, GIS, Shapefile, and Arrow-oriented data paths.

[WKB format](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/wkb.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/wkb.md)[WKBLoader](https://loaders.gl/next/docs/modules/geospatial/wkt/api-reference/wkb-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/wkt/api-reference/wkb-loader.md)[WKT module](https://loaders.gl/next/docs/modules/geospatial/wkt.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/wkt.md)

What it writes

## Put geometry into a compact, widely understood encoding.

WKBWriter is the binary counterpart to WKBLoader. It preserves geometry structure while leaving feature attributes and table metadata to the surrounding application.

01

Input

Structured geometry objects

02

Output

Binary WKB geometry bytes

03

Dimensions

Optional Z and M coordinates

04

APIs

encode and encodeSync

Detailed guide

## WKBWriter reference

The sections below document format metadata, installation, usage, dimensional options, and geometry details.

Writer for the [Well-known binary](https://en.wikipedia.org/wiki/Well-known_text_representation_of_geometry#Well-known_binary) format for representation of geometry.

| WKBWriter      |                                                                                                                 |
| -------------- | --------------------------------------------------------------------------------------------------------------- |
| File Extension | `.wkb`,                                                                                                         |
| File Type      | Binary                                                                                                          |
| File Format    | [Well Known Binary](https://en.wikipedia.org/wiki/Well-known_text_representation_of_geometry#Well-known_binary) |
| Data Format    | [Geometry](https://loaders.gl/next/docs/specifications/category-gis.md)                                    |
| Supported APIs | `encode`, `encodeSync`                                                                                          |
| Encoder Type   | Synchronous                                                                                                     |
| Worker Thread  | ✅ Yes                                                                                                          |

## Installation[​](#installation "Direct link to Installation")

```
npm install @loaders.gl/geospatial

npm install @loaders.gl/core
```

## Usage[​](#usage "Direct link to Usage")

```
import {WKBWriter} from '@loaders.gl/geospatial/wkt';

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

const arrayBuffer = encodeSync(geometry, WKBWriter, {wkb: {hasZ: false, hasM: false}});
```

## Options[​](#options "Direct link to Options")

* `hasZ`: Should be `true` if the GeoJSON input has Z values. These values are expected to be the third coordinate position.
* `hasM`: Should be `true` if the GeoJSON input has M values. Thes are expected to be the third coordinate position if Z values do not exist, or fourth if Z values do exist.

## Format Summary[​](#format-summary "Direct link to Format Summary")

Well-known binary (WKB) is a binary geometry encoding to store geometries (it doesn't store attributes). It's used in databases such as PostGIS and as the internal storage format of Shapefiles. It's also being discussed as the internal storage format for a ["GeoArrow"](https://github.com/geopandas/geo-arrow-spec) specification. WKB is defined starting on page 62 of the [OGC Simple Features specification](http://portal.opengeospatial.org/files/?artifact_id=25355).

It's essentially a binary representation of WKT. For common geospatial types including (Multi) `Point`, `Line`, and `Polygon`, there's a 1:1 correspondence between WKT/WKB and GeoJSON. WKT and WKB also support extended geometry types, such as `Curve`, `Surface`, and `TIN`, which don't have a correspondence to GeoJSON.

* Coordinates can be 2-4 dimensions and are interleaved.
* Positions stored as double precision

![image](https://user-images.githubusercontent.com/15164633/83707157-90413b80-a5d6-11ea-921c-b04208942e79.png)
