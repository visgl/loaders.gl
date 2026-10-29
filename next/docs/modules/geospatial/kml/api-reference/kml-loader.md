KML module · loader API

![](/next/images/format-logos/ogc-mark.svg)OGCKML

# KMLLoader

Parse KML geographic documents into loaders.gl geometry tables, preserving the feature-oriented structure needed for maps and Earth-browser content.

[KML format](https://loaders.gl/next/docs/modules/geospatial/kml/formats/kml.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/kml/formats/kml.md)[KML module](https://loaders.gl/next/docs/modules/geospatial/kml.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/kml.md)

![](/next/images/format-logos/ogc-mark.svg)OGCKML[Try It](https://loaders.gl/next/examples/geospatial/kml)[Overview](https://loaders.gl/next/docs/modules/geospatial/kml/formats/kml.md)[Format](https://loaders.gl/next/docs/modules/geospatial/kml/format.md)[GPX](https://loaders.gl/next/docs/modules/geospatial/kml/formats/gpx.md)[TCX](https://loaders.gl/next/docs/modules/geospatial/kml/formats/tcx.md)[KMLLoader](https://loaders.gl/next/docs/modules/geospatial/kml/api-reference/kml-loader.md)[GPXLoader](https://loaders.gl/next/docs/modules/geospatial/kml/api-reference/gpx-loader.md)[TCXLoader](https://loaders.gl/next/docs/modules/geospatial/kml/api-reference/tcx-loader.md)

What it returns

## Turn geographic documents into reusable data.

KMLLoader maps KML features into the common geometry-table family, giving applications a predictable handoff from document parsing to rendering or analysis.

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

Document

Styles, folders, links, and views in KML

Detailed guide

## KMLLoader reference

The sections below document imports, output shapes, options, and runtime limitations.

The `KMLLoader` parses [KML files](https://en.wikipedia.org/wiki/Keyhole_Markup_Language) into loaders.gl geometry tables.

## Usage[​](#usage "Direct link to Usage")

```
import {KMLLoader} from '@loaders.gl/geospatial/kml';

import {load} from '@loaders.gl/core';



const data = await load(url, KMLLoader, options);
```

## Shapes[​](#shapes "Direct link to Shapes")

`KMLLoader` returns loaders.gl `ArrowTable` objects by default. Set `kml.shape` to select another table representation.

| Shape              | Output                                     |
| ------------------ | ------------------------------------------ |
| `geojson-table`    | loaders.gl GeoJSON table                   |
| `object-row-table` | loaders.gl row table with GeoJSON features |
| `arrow-table`      | loaders.gl `ArrowTable` with WKB geometry  |

## Options[​](#options "Direct link to Options")

| Option      | Type   | Default         | Description                       |
| ----------- | ------ | --------------- | --------------------------------- |
| `kml.shape` | string | `'arrow-table'` | Selects the returned table shape. |

## Limitations[​](#limitations "Direct link to Limitations")

* The loader interprets KML coordinates as WGS84 longitude/latitude (`OGC:CRS84`).
