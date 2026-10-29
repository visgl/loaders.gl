WKT module · geometry loader

![](/next/images/format-logos/ogc-mark.svg)OGCWKB

# WKBLoader

Parse compact Well-Known Binary geometry into loaders.gl data for database, GIS, Shapefile, and GeoArrow-oriented pipelines.

[WKB format](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/wkb.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/wkb.md)[WKBWriter](https://loaders.gl/next/docs/modules/geospatial/wkt/api-reference/wkb-writer.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/wkt/api-reference/wkb-writer.md)[WKT module](https://loaders.gl/next/docs/modules/geospatial/wkt.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/wkt.md)

What it reads

## Keep geometry compact without losing its structure.

WKB stores geometry as binary coordinates and topology without feature attributes. It is a useful boundary format for databases, shapefiles, and columnar geometry pipelines.

01

Input

Binary WKB geometry bytes

02

Output

Structured positions and geometry

03

Dimensions

Two to four coordinate dimensions

04

APIs

load, parse, and parseSync

Detailed guide

## WKBLoader reference

The sections below document format metadata, installation, usage, geometry details, and attribution.

Loader for the [Well-known binary](https://en.wikipedia.org/wiki/Well-known_text_representation_of_geometry#Well-known_binary) format for representation of geometry.

| WKBLoader      |                                                                                                                 |
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
import {WKBLoader} from '@loaders.gl/geospatial/wkt/bundled';

import {parseSync} from '@loaders.gl/core';



// biome-ignore format: preserve intentional fixture layout

const buffer = new Uint8Array([

  1, 1, 0, 0,   0,  0,  0,

  0, 0, 0, 0, 240, 63,  0,

  0, 0, 0, 0,   0,  0, 64

]).buffer;

const data = parseSync(buffer, WKBLoader);

// => {type: 'Point', coordinates: [1, 2]}
```

```
import {WKBLoader} from '@loaders.gl/geospatial/wkt';

import {load} from '@loaders.gl/core';



const data = await load(url, WKBLoader);
```

Asynchronous parsing uses the bundled worker automatically when workers are enabled. When bundling with Vite, the worker URL can be supplied explicitly:

```
import WKT_WORKER_URL from '@loaders.gl/geospatial/wkt-worker.js?url';

import {parse} from '@loaders.gl/core';

import {WKBLoader} from '@loaders.gl/geospatial/wkt';



const data = await parse(buffer, WKBLoader, {wkb: {workerUrl: WKT_WORKER_URL}});
```

## Options[​](#options "Direct link to Options")

| Option          | Type     | Default | Description                             |
| --------------- | -------- | ------- | --------------------------------------- |
| `wkb.workerUrl` | `string` | CDN URL | Override the shared WKT/WKB worker URL. |

## Format Summary[​](#format-summary "Direct link to Format Summary")

WKB encodes geometry without a feature's attributes. It is used in spatial databases and in the `geoarrow.wkb` geometry extension. Shapefile geometry records use their own binary layout; they are not WKB records. See the [WKB format page](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/wkb.md) for compatibility details.

It's essentially a binary representation of WKT. For common geospatial types including (Multi) `Point`, `LineString`, and `Polygon`, there's a 1:1 correspondence between WKT/WKB and GeoJSON. WKT and WKB also support extended geometry types, such as `Curve`, `Surface`, and `TIN`, which don't have a correspondence to GeoJSON.

* Coordinates can be 2-4 dimensions and are interleaved.
* Positions stored as double precision

![image](https://user-images.githubusercontent.com/15164633/83707157-90413b80-a5d6-11ea-921c-b04208942e79.png)
