KML module · loader API

TCX

# TCXLoader

Parse Garmin Training Center XML activities into loaders.gl geometry tables while keeping the activity, lap, and measurement structure available to the application.

[TCX format](https://loaders.gl/next/docs/modules/geospatial/kml/formats/tcx.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/kml/formats/tcx.md)[KML module](https://loaders.gl/next/docs/modules/geospatial/kml.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/kml.md)

TCX[Try It](https://loaders.gl/next/examples/geospatial/kml)[Overview](https://loaders.gl/next/docs/modules/geospatial/kml/formats/kml.md)[Format](https://loaders.gl/next/docs/modules/geospatial/kml/format.md)[GPX](https://loaders.gl/next/docs/modules/geospatial/kml/formats/gpx.md)[TCX](https://loaders.gl/next/docs/modules/geospatial/kml/formats/tcx.md)[KMLLoader](https://loaders.gl/next/docs/modules/geospatial/kml/api-reference/kml-loader.md)[GPXLoader](https://loaders.gl/next/docs/modules/geospatial/kml/api-reference/gpx-loader.md)[TCXLoader](https://loaders.gl/next/docs/modules/geospatial/kml/api-reference/tcx-loader.md)

What it returns

## Keep track geometry compatible with table pipelines.

TCXLoader presents activity tracks through the same geometry-table family used by related loaders, so applications can share rendering and analysis code.

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

## TCXLoader reference

The sections below document imports, output shapes, options, and runtime limitations.

The `TCXLoader` parses [TCX files](https://en.wikipedia.org/wiki/Training_Center_XML) into loaders.gl geometry tables.

## Usage[​](#usage "Direct link to Usage")

```
import {TCXLoader} from '@loaders.gl/geospatial/kml';

import {load} from '@loaders.gl/core';



const data = await load(url, TCXLoader, options);
```

## Shapes[​](#shapes "Direct link to Shapes")

`TCXLoader` returns loaders.gl `ArrowTable` objects by default. Set `tcx.shape` to select another table representation.

| Shape              | Output                                     |
| ------------------ | ------------------------------------------ |
| `geojson-table`    | loaders.gl GeoJSON table                   |
| `object-row-table` | loaders.gl row table with GeoJSON features |
| `arrow-table`      | loaders.gl `ArrowTable` with WKB geometry  |
| `binary-geometry`  | loaders.gl binary feature collection       |

## Options[​](#options "Direct link to Options")

| Option      | Type   | Default         | Description                       |
| ----------- | ------ | --------------- | --------------------------------- |
| `tcx.shape` | string | `'arrow-table'` | Selects the returned table shape. |

## Limitations[​](#limitations "Direct link to Limitations")

* The loader interprets coordinates as WGS84 longitude/latitude (`OGC:CRS84`).
