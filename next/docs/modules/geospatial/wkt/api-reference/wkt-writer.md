WKT module · geometry writer

![](/next/images/format-logos/ogc-mark.svg)OGCWKT

# WKTWriter

Encode structured geometry as readable Well-Known Text for inspection, interchange, logs, and systems that accept the OGC text representation.

[WKT format](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/wkt.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/wkt.md)[WKTLoader](https://loaders.gl/next/docs/modules/geospatial/wkt/api-reference/wkt-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/wkt/api-reference/wkt-loader.md)[WKT module](https://loaders.gl/next/docs/modules/geospatial/wkt.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/wkt.md)

What it writes

## Make geometry readable at the interchange boundary.

WKTWriter provides the text counterpart to WKTLoader, turning loaders.gl geometry into a standard syntax that remains easy to inspect and move between GIS tools.

01

Input

Structured geometry objects

02

Output

Readable WKT text

03

Types

Common and extended geometry forms

04

APIs

encode and encodeSync

Detailed guide

## WKTWriter reference

The sections below document format metadata, installation, usage, options, and attribution.

Writer for the \[Well-known text] format for representation of geometry.

| WKTWriter      |                                                                                             |
| -------------- | ------------------------------------------------------------------------------------------- |
| File Extension | `.wkt`,                                                                                     |
| File Type      | Text                                                                                        |
| File Format    | [Well Known Text](https://en.wikipedia.org/wiki/Well-known_text_representation_of_geometry) |
| Data Format    | [Geometry](https://loaders.gl/next/docs/specifications/category-gis.md)                |
| Supported APIs | `encode`, `encodeSync`                                                                      |

## Installation[​](#installation "Direct link to Installation")

```
npm install @loaders.gl/geospatial

npm install @loaders.gl/core
```

## Usage[​](#usage "Direct link to Usage")

```
import {WKTWriter} from '@loaders.gl/geospatial/wkt';
```

## Options[​](#options "Direct link to Options")

N/A

## Attribution[​](#attribution "Direct link to Attribution")

The `WKTWriter` is based on a fork of the Mapbox [`wellknown`](https://github.com/mapbox/wellknown) module under the ISC license (MIT/BSD 2-clause equivalent).
