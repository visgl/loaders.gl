WKT module · geometry loader

![](/next/images/format-logos/ogc-mark.svg)OGCWKB

# HexWKBLoader

Decode WKB represented as hexadecimal text when a database, API, or JSON envelope cannot carry raw binary bytes directly.

[WKB format](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/wkb.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/wkb.md)[WKBLoader](https://loaders.gl/next/docs/modules/geospatial/wkt/api-reference/wkb-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/wkt/api-reference/wkb-loader.md)[WKT module](https://loaders.gl/next/docs/modules/geospatial/wkt.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/wkt.md)

What it reads

## Cross the text-to-binary boundary once.

HexWKBLoader accepts hexadecimal WKB and returns the same structured geometry shape as the binary WKB loader, so downstream GIS code does not need to care how the bytes arrived.

01

Input

Hexadecimal text containing WKB bytes

02

Output

Structured geometry positions

03

Dimensions

Two to four coordinate dimensions

04

APIs

load, parse, and parseSync

Detailed guide

## HexWKBLoader reference

The sections below document installation, usage, WKB geometry details, and the relationship between hexadecimal and binary inputs.

![From-v2.2](https://img.shields.io/badge/From-v2.2-blue.svg?style=flat-square)

Loader for hex encoded [Well-known binary](https://en.wikipedia.org/wiki/Well-known_text_representation_of_geometry#Well-known_binary) format for representation of geometry.

| HexWKBLoader   |                                                                                                                 |
| -------------- | --------------------------------------------------------------------------------------------------------------- |
| File Extension | `.wkb`,                                                                                                         |
| File Type      | Binary                                                                                                          |
| File Format    | [Well Known Binary](https://en.wikipedia.org/wiki/Well-known_text_representation_of_geometry#Well-known_binary) |
| Data Format    | [Geometry](https://loaders.gl/next/docs/specifications/category-gis.md)                                    |
| Supported APIs | `load`, `parse`, `parseSync`                                                                                    |
| Decoder Type   | Synchronous                                                                                                     |
| Worker Thread  | ✅ Yes                                                                                                          |

## Installation[​](#installation "Direct link to Installation")

```
npm install @loaders.gl/geospatial

npm install @loaders.gl/core
```

## Usage[​](#usage "Direct link to Usage")

```
import {HexWKBLoader} from '@loaders.gl/geospatial/wkt/bundled';

import {parseSync} from '@loaders.gl/core';



const hexWkb = '0101000000000000000000f03f0000000000000040';

const data = parseSync(hexWkb, HexWKBLoader);

// => {type: 'Point', coordinates: [1, 2]}
```

```
import {HexWKBLoader} from '@loaders.gl/geospatial/wkt';

import {load} from '@loaders.gl/core';



const data = await load(url, HexWKBLoader);
```

## Options[​](#options "Direct link to Options")

N/A

## Format Summary[​](#format-summary "Direct link to Format Summary")

WKB encodes geometry without a feature's attributes. It is used in spatial databases and in the `geoarrow.wkb` geometry extension. Shapefile geometry records use their own binary layout; they are not WKB records. See the [WKB format page](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/wkb.md) for compatibility details.

It's essentially a binary representation of WKT. For common geospatial types including (Multi) `Point`, `LineString`, and `Polygon`, there's a 1:1 correspondence between WKT/WKB and GeoJSON. WKT and WKB also support extended geometry types, such as `Curve`, `Surface`, and `TIN`, which don't have a correspondence to GeoJSON.

* Coordinates can be 2-4 dimensions and are interleaved.
* Positions stored as double precision

![image](https://user-images.githubusercontent.com/15164633/83707157-90413b80-a5d6-11ea-921c-b04208942e79.png)
