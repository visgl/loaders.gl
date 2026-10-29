KML module · loader API

GPX

# GPXLoader

Parse GPX routes, tracks, and waypoints into loaders.gl geometry tables, with optional Arrow and binary representations for downstream processing.

[GPX format](https://loaders.gl/next/docs/modules/geospatial/kml/formats/gpx.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/kml/formats/gpx.md)[KML module](https://loaders.gl/next/docs/modules/geospatial/kml.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/kml.md)

GPX[Try It](https://loaders.gl/next/examples/geospatial/kml)[Overview](https://loaders.gl/next/docs/modules/geospatial/kml/formats/kml.md)[Format](https://loaders.gl/next/docs/modules/geospatial/kml/format.md)[GPX](https://loaders.gl/next/docs/modules/geospatial/kml/formats/gpx.md)[TCX](https://loaders.gl/next/docs/modules/geospatial/kml/formats/tcx.md)[KMLLoader](https://loaders.gl/next/docs/modules/geospatial/kml/api-reference/kml-loader.md)[GPXLoader](https://loaders.gl/next/docs/modules/geospatial/kml/api-reference/gpx-loader.md)[TCXLoader](https://loaders.gl/next/docs/modules/geospatial/kml/api-reference/tcx-loader.md)

What it returns

## Choose the table shape that fits the next stage.

The default output is easy to use in mapping code. When a pipeline needs compact geometry or columnar interchange, GPXLoader can return binary or Arrow-backed forms instead.

01

Default

GeoJSONTable for application code

02

Rows

Object-row table for inspection

03

Columns

ArrowTable with WKB geometry

04

Binary

Binary feature collection for rendering

Detailed guide

## GPXLoader reference

The sections below document imports, output shapes, options, and runtime limitations.

The `GPXLoader` parses [GPX files](https://en.wikipedia.org/wiki/GPS_Exchange_Format) into loaders.gl geometry tables.

## Usage[​](#usage "Direct link to Usage")

```
import {GPXLoader} from '@loaders.gl/geospatial/kml';

import {load} from '@loaders.gl/core';



const data = await load(url, GPXLoader, options);
```

## Shapes[​](#shapes "Direct link to Shapes")

`GPXLoader` returns loaders.gl `ArrowTable` objects by default. Set `gpx.shape` to select another table representation.

| Shape              | Output                                     |
| ------------------ | ------------------------------------------ |
| `geojson-table`    | loaders.gl GeoJSON table                   |
| `object-row-table` | loaders.gl row table with GeoJSON features |
| `arrow-table`      | loaders.gl `ArrowTable` with WKB geometry  |
| `binary-geometry`  | loaders.gl binary feature collection       |

## Options[​](#options "Direct link to Options")

| Option      | Type   | Default         | Description                       |
| ----------- | ------ | --------------- | --------------------------------- |
| `gpx.shape` | string | `'arrow-table'` | Selects the returned table shape. |

## Limitations[​](#limitations "Direct link to Limitations")

* The loader interprets coordinates as WGS84 longitude/latitude (`OGC:CRS84`).
