WKT and WKB module

![](/next/images/format-logos/ogc-mark.svg)OGCWKT

# Keep geometry and coordinate systems interoperable.

`@loaders.gl/geospatial/wkt` handles OGC Well-Known Text, Well-Known Binary, and WKT coordinate reference systems. It provides loaders and writers for the syntax boundaries that appear across GIS formats.

[WKT formats](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/wkt.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/wkt.md)[CRS guide](https://loaders.gl/next/docs/developer-guide/coordinate-reference-systems.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/coordinate-reference-systems.md)[WKT APIs](https://loaders.gl/next/docs/modules/geospatial/wkt/api-reference/wkt-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/wkt/api-reference/wkt-loader.md)

The geometry syntax path

## Parse text or bytes. Preserve the geometry meaning.

Choose WKT for readable interchange, WKB for compact binary geometry, or WKT-CRS for spatial reference definitions. The same module also provides the corresponding writers.

01

WKT

Readable geometry text

02

WKB

Compact binary geometry

03

WKT-CRS

Coordinate reference system syntax

04

Output

Geometry or CRS objects for GIS pipelines

Detailed guide

## Format and API details

The reference below covers supported syntaxes, loaders, writers, CRS handling, and the upstream implementations used by the module.

See [Coordinate Reference Systems](https://loaders.gl/next/docs/developer-guide/coordinate-reference-systems.md) for WKT syntax handling, shared CRS types, and cross-format CRS support.

## Formats[​](#formats "Direct link to Formats")

The `@loaders.gl/geospatial/wkt` module handles the following formats:

| Format                                                                                                                                 | Description                               |
| -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| [`Well Known Text (WKT)`](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/wkt.md)                                     | ASCII format for geometry features        |
| [`Well Known Binary (WKB)`](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/wkb.md)                                   | Binary format for geometry features       |
| [`Well Known Text Coordinate Reference System (WKT-CRS)`](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/wkt-crs.md) | Text format for spatial reference systems |

## Loaders and Writers[​](#loaders-and-writers "Direct link to Loaders and Writers")

| Loader / Writer                                                                                            | Description                                          |
| ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| [`WKBLoader`](https://loaders.gl/next/docs/modules/geospatial/wkt/api-reference/wkb-loader.md)        | Parses Well-Known Binary geometry.                   |
| [`WKBWriter`](https://loaders.gl/next/docs/modules/geospatial/wkt/api-reference/wkb-writer.md)        | Writes geometry as Well-Known Binary.                |
| [`WKTLoader`](https://loaders.gl/next/docs/modules/geospatial/wkt/api-reference/wkt-loader.md)        | Parses Well-Known Text geometry.                     |
| [`WKTWriter`](https://loaders.gl/next/docs/modules/geospatial/wkt/api-reference/wkt-writer.md)        | Writes geometry as Well-Known Text.                  |
| [`WKTCRSLoader`](https://loaders.gl/next/docs/modules/geospatial/wkt/api-reference/wkt-crs-loader.md) | Parses Well-Known Text coordinate reference systems. |
| [`WKTCRSWriter`](https://loaders.gl/next/docs/modules/geospatial/wkt/api-reference/wkt-crs-writer.md) | Writes coordinate reference systems as WKT-CRS.      |

## Attribution[​](#attribution "Direct link to Attribution")

The `WKTLoader` is based on a fork of the Mapbox [`wellknown`](https://github.com/mapbox/wellknown) module under the ISC license (MIT/BSD 2-clause equivalent). The `WKBLoader` and `WKBWriter` are forked from <https://github.com/cschwarz/wkx> under MIT license, Copyright (c) 2013 Christian Schwarz. The `WKTCRSLoader` and `WKTCRSWriter` are thin adapters over the dependency-free syntax codecs in `@math.gl/geospatial/crs`.

## Sources and credits[​](#sources-and-credits "Direct link to Sources and credits")

See the [package source and license inventory](https://github.com/visgl/loaders.gl/blob/master/modules/geospatial/THIRD-PARTY-NOTICES.md) and the project-wide [References and credits](https://loaders.gl/next/docs/references-and-credits.md).
