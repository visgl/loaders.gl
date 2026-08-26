# Overview

See [Coordinate Reference Systems](/docs/developer-guide/coordinate-reference-systems) for WKT
syntax handling, shared CRS types, and cross-format CRS support.

![ogc-logo](../../images/logos/ogc-logo-60.png)

## Formats

The `@loaders.gl/wkt` module handles the following formats:

| Format                                                                                       | Description                               |
| -------------------------------------------------------------------------------------------- | ----------------------------------------- |
| [`Well Known Text (WKT)`](/docs/modules/wkt/formats/wkt)                                     | ASCII format for geometry features        |
| [`Well Known Binary (WKB)`](/docs/modules/wkt/formats/wkb)                                   | Binary format for geometry features       |
| [`Well Known Text Coordinate Reference System (WKT-CRS)`](/docs/modules/wkt/formats/wkt-crs) | Text format for spatial reference systems |

## Loaders and Writers

| Loader / Writer | Description |
| --------------- | ----------- |
| [`WKBLoader`](/docs/modules/wkt/api-reference/wkb-loader) | Parses Well-Known Binary geometry. |
| [`WKBWriter`](/docs/modules/wkt/api-reference/wkb-writer) | Writes geometry as Well-Known Binary. |
| [`WKTLoader`](/docs/modules/wkt/api-reference/wkt-loader) | Parses Well-Known Text geometry. |
| [`WKTWriter`](/docs/modules/wkt/api-reference/wkt-writer) | Writes geometry as Well-Known Text. |
| [`WKTCRSLoader`](/docs/modules/wkt/api-reference/wkt-crs-loader) | Parses Well-Known Text coordinate reference systems. |
| [`WKTCRSWriter`](/docs/modules/wkt/api-reference/wkt-crs-writer) | Writes coordinate reference systems as WKT-CRS. |

## Attribution

The `WKTLoader` is based on a fork of the Mapbox [`wellknown`](https://github.com/mapbox/wellknown) module under the ISC license (MIT/BSD 2-clause equivalent).
The `WKBLoader` and `WKBWriter` are forked from https://github.com/cschwarz/wkx under MIT license, Copyright (c) 2013 Christian Schwarz.
The `WKTCRSLoader` and `WKTCRSWriter` are thin adapters over the dependency-free syntax codecs in
`@math.gl/crs`.
