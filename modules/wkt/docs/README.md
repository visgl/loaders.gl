# Overview

The `@loaders.gl/wkt` module handles the [Well Known Text (WKT)](https://en.wikipedia.org/wiki/Well-known_text_representation_of_geometry) format, an ASCII format that defines geospatial geometries; and the [Well Known Binary](https://en.wikipedia.org/wiki/Well-known_text_representation_of_geometry) format, WKT's binary equivalent.

## Installation

```bash
npm install @loaders.gl/wkt
npm install @loaders.gl/core
```

## Loaders and Writers

| Loader                                                   |
| -------------------------------------------------------- |
| [`WKBLoader`](modules/wkt/docs/api-reference/wkb-loader) |
| [`WKBWriter`](modules/wkt/docs/api-reference/wkb-writer) |
| [`WKTLoader`](modules/wkt/docs/api-reference/wkt-loader) |
| [`WKTWriter`](modules/wkt/docs/api-reference/wkt-writer) |

## Format Notes

A number of variants of WKT and WKB exist

| Format | Support | Description |
| --- | --- | --- |
| WKT | Y | Text representation |
| WKB | Y | Binary representation |
| EWKT | N | WKT that starts with a spatial reference id (SRID) |
| TWKB | N | WKB variant that uses varints, precision truncation and zigzag point encoding to reduce uncompressed binary size ~2x (compressed size reduction is less). |

## Attribution

The `WKTLoader` is based on a fork of the Mapbox [`wellknown`](https://github.com/mapbox/wellknown) module under the ISC license (MIT/BSD 2-clause equivalent).
The `WKBLoader` and `WKBWriter` are forked from https://github.com/cschwarz/wkx under MIT license, Copyright (c) 2013 Christian Schwarz.
