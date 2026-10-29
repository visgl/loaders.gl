WKT module · geometry loader

![](/next/images/format-logos/ogc-mark.svg)OGCWKB

# TWKBLoader

Parse Tiny Well-Known Binary geometry and expose it through the same application-facing geometry shape used by the WKT module.

[TWKB format](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/twkb.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/twkb.md)[TWKBWriter](https://loaders.gl/next/docs/modules/geospatial/wkt/api-reference/twkb-writer.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/wkt/api-reference/twkb-writer.md)[WKT module](https://loaders.gl/next/docs/modules/geospatial/wkt.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/wkt.md)

What it reads

## Reconstruct geometry from compact integer records.

TWKB reduces transport size by quantizing coordinates and storing neighboring positions as deltas. The loader handles that binary representation before returning structured geometry data.

01

Input

Tiny Well-Known Binary bytes

02

Encoding

Quantized coordinates, deltas, and varints

03

Output

Structured geometry positions

04

APIs

load, parse, and parseSync

Detailed guide

## TWKBLoader reference

The sections below document installation, usage, the compact geometry encoding, and the current loader behavior.

![From-v4.0](https://img.shields.io/badge/From-v4.0-blue.svg?style=flat-square)

Loader for [Tiny Well-Known Binary](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/twkb.md), a compact geometry encoding distinct from WKB.

| TWKBLoader     |                                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------------- |
| File Extension | `.twkb`                                                                                            |
| File Type      | Binary                                                                                             |
| File Format    | [Tiny Well Known Binary](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/twkb.md) |
| Data Format    | [Geometry](https://loaders.gl/next/docs/specifications/category-gis.md)                       |
| Supported APIs | `load`, `parse`, `parseSync`                                                                       |
| Decoder Type   | Synchronous                                                                                        |
| Worker Thread  | ✅ Yes                                                                                             |

## Installation[​](#installation "Direct link to Installation")

```
npm install @loaders.gl/geospatial

npm install @loaders.gl/core
```

## Usage[​](#usage "Direct link to Usage")

```
import {TWKBLoader} from '@loaders.gl/geospatial/wkt/bundled';

import {parseSync} from '@loaders.gl/core';



// Precision zero, Point (1, 2), zigzag-encoded coordinates.

const buffer = new Uint8Array([1, 0, 2, 4]).buffer;

const data = parseSync(buffer, TWKBLoader);

// => {type: 'Point', coordinates: [1, 2]}
```

```
import {TWKBLoader} from '@loaders.gl/geospatial/wkt';

import {load} from '@loaders.gl/core';



const data = await load(url, TWKBLoader);
```

## Options[​](#options "Direct link to Options")

N/A

## Format summary[​](#format-summary "Direct link to Format summary")

TWKB stores quantized coordinates as variable-length integers, with deltas between successive positions. Precision is encoded in the header. It does not store WKB's double-precision coordinate records. See the [TWKB format page](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/twkb.md) for supported geometry types and format boundaries.
