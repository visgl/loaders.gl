WKT module · geometry loader

![](/next/images/format-logos/ogc-mark.svg)OGCWKT

# WKTLoader

Parse readable Well-Known Text geometry into the loaders.gl geometry representation used by mapping, analysis, and conversion pipelines.

[WKT format](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/wkt.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/wkt.md)[WKTWriter](https://loaders.gl/next/docs/modules/geospatial/wkt/api-reference/wkt-writer.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/wkt/api-reference/wkt-writer.md)[WKT module](https://loaders.gl/next/docs/modules/geospatial/wkt.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/wkt.md)

What it reads

## Use text when the geometry should stay inspectable.

WKT is easy to log, inspect, and exchange. WKTLoader handles the geometry syntax boundary and returns structured geometry without attaching feature attributes.

01

Input

Readable WKT geometry text

02

Output

Structured geometry coordinates

03

Types

Points, lines, polygons, and extensions

04

APIs

load, parse, and parseSync

Detailed guide

## WKTLoader reference

The sections below document format metadata, installation, usage, options, and attribution.

Loader and writer for the [Well-known text](https://en.wikipedia.org/wiki/Well-known_text_representation_of_geometry) format for representation of geometry.

| WKTLoader      |                                                                                                                 |
| -------------- | --------------------------------------------------------------------------------------------------------------- |
| File Extension | `.wkt`,                                                                                                         |
| File Type      | Text                                                                                                            |
| File Format    | [Well Known Text](https://en.wikipedia.org/wiki/Well-known_text_representation_of_geometry)                     |
| Data Format    | [Geometry](https://loaders.gl/next/docs/specifications/category-gis.md)                                    |
| Supported APIs | `load`, `parse`, `parseSync`                                                                                    |
| Decoder Type   | Synchronous                                                                                                     |
| Worker Thread  | ✅ Yes [![Website shields.io](https://img.shields.io/badge/v2.2-blue.svg?style=flat-square)](http://shields.io) |

## Installation[​](#installation "Direct link to Installation")

```
npm install @loaders.gl/geospatial

npm install @loaders.gl/core
```

## Usage[​](#usage "Direct link to Usage")

```
import {WKTLoader} from '@loaders.gl/geospatial/wkt/bundled';

import {parseSync} from '@loaders.gl/core';



const data = parseSync('LINESTRING (30 10, 10 30, 40 40)', WKTLoader);

// => {type: 'LineString', coordinates: [[30, 10], [10, 30], [40, 40]]}
```

```
import {WKTLoader} from '@loaders.gl/geospatial/wkt';

import {load} from '@loaders.gl/core';



const data = await load(url, WKTLoader);
```

## Options[​](#options "Direct link to Options")

N/A

## Attribution[​](#attribution "Direct link to Attribution")

The `WKTLoader` is based on a fork of the Mapbox [`wellknown`](https://github.com/mapbox/wellknown) module under the ISC license (MIT/BSD 2-clause equivalent).
