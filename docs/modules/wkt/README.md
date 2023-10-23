# Overview

![ogc-logo](../../images/logos/ogc-logo-60.png)

## Formats

The `@loaders.gl/wkt` module handles the following formats:

| Format                                         | Description                      |
| ---------------------------------------------- | -------------------------------- |
| [`Well Known Text (WKT)`](/docs/modules/wkt/formats/wkt)         | ASCII format for geometry features |
| [`Well Known Binary (WKB)`](/docs/modules/wkt/formats/wkb)         | Binary format for geometry features         |
| [`Well Known Text Coordinate Reference System (WKT-CRS)`](/docs/modules/wkt/formats/wkt-crs) | Text format for spatial reference systems        |

## Loaders and Writers

| Loader                                                           |
| ---------------------------------------------------------------- |
| [`WKBLoader`](/docs/modules/wkt/api-reference/wkb-loader)        |
| [`WKBWriter`](/docs/modules/wkt/api-reference/wkb-writer)        |
| [`WKTLoader`](/docs/modules/wkt/api-reference/wkt-loader)        |
| [`WKTWriter`](/docs/modules/wkt/api-reference/wkt-writer)        |
| [`WKTCRSLoader`](/docs/modules/wkt/api-reference/wkt-crs-loader) |
| [`WKTCRSWriter`](/docs/modules/wkt/api-reference/wkt-crs-writer) |


## Attribution

The `WKTLoader` is based on a fork of the Mapbox [`wellknown`](https://github.com/mapbox/wellknown) module under the ISC license (MIT/BSD 2-clause equivalent).
The `WKBLoader` and `WKBWriter` are forked from https://github.com/cschwarz/wkx under MIT license, Copyright (c) 2013 Christian Schwarz.
The `WKTCRSLoader` and `WKTCRSWriter` are based on a fork of https://github.com/DanielJDufour/wkt-crs under Creative Commons CC0 1.0 license.
