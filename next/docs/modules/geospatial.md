# @loaders.gl/geospatial

Geospatial vector formats and geometry loader/writer descriptors share one package. Codec and geometry-construction utilities live in independent core subpaths.

| Format                                                                                                                                            | Subpath                                                                             | Description     |
| ------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | --------------- |
| [![](/next/images/format-logos/ogc-mark.svg)OGCKML](https://loaders.gl/next/docs/modules/geospatial/kml/formats/kml.md)                      | [`/kml`](https://loaders.gl/next/docs/modules/geospatial/kml.md)               | KML             |
| —                                                                                                                                                 | [`/gpx`](https://loaders.gl/next/docs/modules/geospatial/kml/formats/gpx.md)   | GPX             |
| —                                                                                                                                                 | [`/tcx`](https://loaders.gl/next/docs/modules/geospatial/kml/formats/tcx.md)   | TCX             |
| [![](/next/images/format-logos/ogc-mark.svg)OGCKML](https://loaders.gl/next/docs/modules/geospatial/kml/formats/kml.md)                      | [`/kmz`](https://loaders.gl/next/docs/modules/geospatial/kml.md)               | KMZ             |
| —                                                                                                                                                 | [`/shapefile`](https://loaders.gl/next/docs/modules/geospatial/shapefile.md)   | Shapefile       |
| —                                                                                                                                                 | [`/shp`](https://loaders.gl/next/docs/modules/geospatial/shapefile.md)         | SHP geometry    |
| —                                                                                                                                                 | [`/dbf`](https://loaders.gl/next/docs/modules/geospatial/shapefile.md)         | DBF attributes  |
| [![](/next/images/format-logos/flatgeobuf-logo.png)](https://loaders.gl/next/docs/modules/geospatial/flatgeobuf/formats/flatgeobuf.md)       | [`/flatgeobuf`](https://loaders.gl/next/docs/modules/geospatial/flatgeobuf.md) | FlatGeobuf      |
| [![](/next/images/format-logos/ogc-mark.svg)OGCGeoPackage](https://loaders.gl/next/docs/modules/geospatial/geopackage/formats/geopackage.md) | [`/geopackage`](https://loaders.gl/next/docs/modules/geospatial/geopackage.md) | GeoPackage      |
| [![](/next/images/format-logos/ogc-mark.svg)OGCWKT](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/wkt.md)                      | [`/wkt`](https://loaders.gl/next/docs/modules/geospatial/wkt.md)               | WKT and WKT CRS |
| [![](/next/images/format-logos/ogc-mark.svg)OGCWKB](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/wkb.md)                      | [`/wkb`](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/wkb.md)   | WKB and Hex WKB |
| —                                                                                                                                                 | [`/twkb`](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/twkb.md) | Tiny WKB        |

Import metadata from the package root or format subpaths. Parser-bearing loaders use named implementation entrypoints, such as `@loaders.gl/geospatial/wkb-loader`. GeoPackage requires the optional `sql.js` peer dependency. See [Get Started](https://loaders.gl/next/docs/developer-guide/get-started.md#install-packages-import-subpaths) for installation and loading patterns.

## Format guides[​](#format-guides "Direct link to Format guides")

* [FlatGeobuf](https://loaders.gl/next/docs/modules/geospatial/flatgeobuf/formats/flatgeobuf.md)
* [GeoPackage](https://loaders.gl/next/docs/modules/geospatial/geopackage/formats/geopackage.md)
* [GPX](https://loaders.gl/next/docs/modules/geospatial/kml/formats/gpx.md)
* [KML](https://loaders.gl/next/docs/modules/geospatial/kml/formats/kml.md)
* [TCX](https://loaders.gl/next/docs/modules/geospatial/kml/formats/tcx.md)
* [Shapefile](https://loaders.gl/next/docs/modules/geospatial/shapefile/formats/shapefile.md)
* [TWKB - Tiny Well-Known Binary](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/twkb.md)
* [WKB - Well-Known Binary](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/wkb.md)
* [WKT-CRS - Coordinate Systems](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/wkt-crs.md)
* [Well-Known Text](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/wkt.md)

## Package exports[​](#package-exports "Direct link to Package exports")

All exported subpaths (<!-- -->77<!-- -->)

These are the package's public exports, including format entry points, parsers, writers, sources, and worker assets.

| Format                                                                                                                                            | Import subpath                                                          |
| ------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
|                                                                                                                                                   | `@loaders.gl/geospatial/dbf`                                            |
|                                                                                                                                                   | `@loaders.gl/geospatial/dbf-loader`                                     |
|                                                                                                                                                   | `@loaders.gl/geospatial/dbf-loader-types`                               |
| [![](/next/images/format-logos/flatgeobuf-logo.png)](https://loaders.gl/next/docs/modules/geospatial/flatgeobuf/formats/flatgeobuf.md)       | `@loaders.gl/geospatial/flatgeobuf`                                     |
| [![](/next/images/format-logos/flatgeobuf-logo.png)](https://loaders.gl/next/docs/modules/geospatial/flatgeobuf/formats/flatgeobuf.md)       | `@loaders.gl/geospatial/flatgeobuf-loader`                              |
| [![](/next/images/format-logos/flatgeobuf-logo.png)](https://loaders.gl/next/docs/modules/geospatial/flatgeobuf/formats/flatgeobuf.md)       | `@loaders.gl/geospatial/flatgeobuf-loader-types`                        |
| [![](/next/images/format-logos/flatgeobuf-logo.png)](https://loaders.gl/next/docs/modules/geospatial/flatgeobuf/formats/flatgeobuf.md)       | `@loaders.gl/geospatial/flatgeobuf-source-loader`                       |
| [![](/next/images/format-logos/flatgeobuf-logo.png)](https://loaders.gl/next/docs/modules/geospatial/flatgeobuf/formats/flatgeobuf.md)       | `@loaders.gl/geospatial/flatgeobuf/bundled`                             |
| [![](/next/images/format-logos/flatgeobuf-logo.png)](https://loaders.gl/next/docs/modules/geospatial/flatgeobuf/formats/flatgeobuf.md)       | `@loaders.gl/geospatial/flatgeobuf/flatgeobuf-format`                   |
| [![](/next/images/format-logos/flatgeobuf-logo.png)](https://loaders.gl/next/docs/modules/geospatial/flatgeobuf/formats/flatgeobuf.md)       | `@loaders.gl/geospatial/flatgeobuf/flatgeobuf-table-query-capabilities` |
| [![](/next/images/format-logos/flatgeobuf-logo.png)](https://loaders.gl/next/docs/modules/geospatial/flatgeobuf/formats/flatgeobuf.md)       | `@loaders.gl/geospatial/flatgeobuf/index`                               |
| [![](/next/images/format-logos/flatgeobuf-logo.png)](https://loaders.gl/next/docs/modules/geospatial/flatgeobuf/formats/flatgeobuf.md)       | `@loaders.gl/geospatial/flatgeobuf/unbundled`                           |
| [![](/next/images/format-logos/ogc-mark.svg)OGCGeoPackage](https://loaders.gl/next/docs/modules/geospatial/geopackage/formats/geopackage.md) | `@loaders.gl/geospatial/geopackage`                                     |
| [![](/next/images/format-logos/ogc-mark.svg)OGCGeoPackage](https://loaders.gl/next/docs/modules/geospatial/geopackage/formats/geopackage.md) | `@loaders.gl/geospatial/geopackage-loader`                              |
| [![](/next/images/format-logos/ogc-mark.svg)OGCGeoPackage](https://loaders.gl/next/docs/modules/geospatial/geopackage/formats/geopackage.md) | `@loaders.gl/geospatial/geopackage-loader-types`                        |
| [![](/next/images/format-logos/ogc-mark.svg)OGCGeoPackage](https://loaders.gl/next/docs/modules/geospatial/geopackage/formats/geopackage.md) | `@loaders.gl/geospatial/geopackage-source-loader`                       |
| [![](/next/images/format-logos/ogc-mark.svg)OGCGeoPackage](https://loaders.gl/next/docs/modules/geospatial/geopackage/formats/geopackage.md) | `@loaders.gl/geospatial/geopackage/bundled`                             |
| [![](/next/images/format-logos/ogc-mark.svg)OGCGeoPackage](https://loaders.gl/next/docs/modules/geospatial/geopackage/formats/geopackage.md) | `@loaders.gl/geospatial/geopackage/geopackage-format`                   |
| [![](/next/images/format-logos/ogc-mark.svg)OGCGeoPackage](https://loaders.gl/next/docs/modules/geospatial/geopackage/formats/geopackage.md) | `@loaders.gl/geospatial/geopackage/geopackage-loader-options`           |
| [![](/next/images/format-logos/ogc-mark.svg)OGCGeoPackage](https://loaders.gl/next/docs/modules/geospatial/geopackage/formats/geopackage.md) | `@loaders.gl/geospatial/geopackage/index`                               |
| [![](/next/images/format-logos/ogc-mark.svg)OGCGeoPackage](https://loaders.gl/next/docs/modules/geospatial/geopackage/formats/geopackage.md) | `@loaders.gl/geospatial/geopackage/unbundled`                           |
|                                                                                                                                                   | `@loaders.gl/geospatial/gpx`                                            |
|                                                                                                                                                   | `@loaders.gl/geospatial/gpx-loader`                                     |
|                                                                                                                                                   | `@loaders.gl/geospatial/gpx-loader-types`                               |
|                                                                                                                                                   | `@loaders.gl/geospatial/hex-wkb-loader`                                 |
|                                                                                                                                                   | `@loaders.gl/geospatial/hex-wkb-loader-types`                           |
| [![](/next/images/format-logos/ogc-mark.svg)OGCKML](https://loaders.gl/next/docs/modules/geospatial/kml/formats/kml.md)                      | `@loaders.gl/geospatial/kml`                                            |
| [![](/next/images/format-logos/ogc-mark.svg)OGCKML](https://loaders.gl/next/docs/modules/geospatial/kml/formats/kml.md)                      | `@loaders.gl/geospatial/kml-loader`                                     |
| [![](/next/images/format-logos/ogc-mark.svg)OGCKML](https://loaders.gl/next/docs/modules/geospatial/kml/formats/kml.md)                      | `@loaders.gl/geospatial/kml-loader-types`                               |
| [![](/next/images/format-logos/ogc-mark.svg)OGCKML](https://loaders.gl/next/docs/modules/geospatial/kml/formats/kml.md)                      | `@loaders.gl/geospatial/kml-writer`                                     |
| [![](/next/images/format-logos/ogc-mark.svg)OGCKML](https://loaders.gl/next/docs/modules/geospatial/kml/formats/kml.md)                      | `@loaders.gl/geospatial/kml/bundled`                                    |
| [![](/next/images/format-logos/ogc-mark.svg)OGCKML](https://loaders.gl/next/docs/modules/geospatial/kml/formats/kml.md)                      | `@loaders.gl/geospatial/kml/index`                                      |
| [![](/next/images/format-logos/ogc-mark.svg)OGCKML](https://loaders.gl/next/docs/modules/geospatial/kml/formats/kml.md)                      | `@loaders.gl/geospatial/kml/kml-format`                                 |
| [![](/next/images/format-logos/ogc-mark.svg)OGCKML](https://loaders.gl/next/docs/modules/geospatial/kml/formats/kml.md)                      | `@loaders.gl/geospatial/kml/kml-parser`                                 |
| [![](/next/images/format-logos/ogc-mark.svg)OGCKML](https://loaders.gl/next/docs/modules/geospatial/kml/formats/kml.md)                      | `@loaders.gl/geospatial/kml/kmz-archive`                                |
| [![](/next/images/format-logos/ogc-mark.svg)OGCKML](https://loaders.gl/next/docs/modules/geospatial/kml/formats/kml.md)                      | `@loaders.gl/geospatial/kml/sports-track-parser`                        |
| [![](/next/images/format-logos/ogc-mark.svg)OGCKML](https://loaders.gl/next/docs/modules/geospatial/kml/formats/kml.md)                      | `@loaders.gl/geospatial/kml/unbundled`                                  |
|                                                                                                                                                   | `@loaders.gl/geospatial/kmz`                                            |
|                                                                                                                                                   | `@loaders.gl/geospatial/kmz-loader`                                     |
|                                                                                                                                                   | `@loaders.gl/geospatial/kmz-loader-types`                               |
|                                                                                                                                                   | `@loaders.gl/geospatial/kmz-source`                                     |
|                                                                                                                                                   | `@loaders.gl/geospatial/shapefile`                                      |
|                                                                                                                                                   | `@loaders.gl/geospatial/shapefile-arrow-loader`                         |
|                                                                                                                                                   | `@loaders.gl/geospatial/shapefile-loader`                               |
|                                                                                                                                                   | `@loaders.gl/geospatial/shapefile-loader-types`                         |
|                                                                                                                                                   | `@loaders.gl/geospatial/shapefile-worker.js`                            |
|                                                                                                                                                   | `@loaders.gl/geospatial/shapefile/bundled`                              |
|                                                                                                                                                   | `@loaders.gl/geospatial/shapefile/dbf-format`                           |
|                                                                                                                                                   | `@loaders.gl/geospatial/shapefile/index`                                |
|                                                                                                                                                   | `@loaders.gl/geospatial/shapefile/shp-format`                           |
|                                                                                                                                                   | `@loaders.gl/geospatial/shapefile/unbundled`                            |
|                                                                                                                                                   | `@loaders.gl/geospatial/shp`                                            |
|                                                                                                                                                   | `@loaders.gl/geospatial/shp-loader`                                     |
|                                                                                                                                                   | `@loaders.gl/geospatial/shp-loader-types`                               |
|                                                                                                                                                   | `@loaders.gl/geospatial/tcx`                                            |
|                                                                                                                                                   | `@loaders.gl/geospatial/tcx-loader`                                     |
|                                                                                                                                                   | `@loaders.gl/geospatial/tcx-loader-types`                               |
|                                                                                                                                                   | `@loaders.gl/geospatial/twkb`                                           |
|                                                                                                                                                   | `@loaders.gl/geospatial/twkb-loader`                                    |
|                                                                                                                                                   | `@loaders.gl/geospatial/twkb-loader-types`                              |
|                                                                                                                                                   | `@loaders.gl/geospatial/twkb-writer`                                    |
| [![](/next/images/format-logos/ogc-mark.svg)OGCWKB](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/wkb.md)                      | `@loaders.gl/geospatial/wkb`                                            |
| [![](/next/images/format-logos/ogc-mark.svg)OGCWKB](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/wkb.md)                      | `@loaders.gl/geospatial/wkb-loader`                                     |
| [![](/next/images/format-logos/ogc-mark.svg)OGCWKB](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/wkb.md)                      | `@loaders.gl/geospatial/wkb-loader-types`                               |
| [![](/next/images/format-logos/ogc-mark.svg)OGCWKB](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/wkb.md)                      | `@loaders.gl/geospatial/wkb-writer`                                     |
| [![](/next/images/format-logos/ogc-mark.svg)OGCWKT](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/wkt.md)                      | `@loaders.gl/geospatial/wkt`                                            |
| [![](/next/images/format-logos/ogc-mark.svg)OGCWKT](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/wkt.md)                      | `@loaders.gl/geospatial/wkt-crs-loader`                                 |
| [![](/next/images/format-logos/ogc-mark.svg)OGCWKT](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/wkt.md)                      | `@loaders.gl/geospatial/wkt-crs-loader-types`                           |
| [![](/next/images/format-logos/ogc-mark.svg)OGCWKT](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/wkt.md)                      | `@loaders.gl/geospatial/wkt-crs-writer`                                 |
| [![](/next/images/format-logos/ogc-mark.svg)OGCWKT](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/wkt.md)                      | `@loaders.gl/geospatial/wkt-loader`                                     |
| [![](/next/images/format-logos/ogc-mark.svg)OGCWKT](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/wkt.md)                      | `@loaders.gl/geospatial/wkt-loader-types`                               |
| [![](/next/images/format-logos/ogc-mark.svg)OGCWKT](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/wkt.md)                      | `@loaders.gl/geospatial/wkt-worker.js`                                  |
| [![](/next/images/format-logos/ogc-mark.svg)OGCWKT](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/wkt.md)                      | `@loaders.gl/geospatial/wkt-writer`                                     |
| [![](/next/images/format-logos/ogc-mark.svg)OGCWKT](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/wkt.md)                      | `@loaders.gl/geospatial/wkt/bundled`                                    |
| [![](/next/images/format-logos/ogc-mark.svg)OGCWKT](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/wkt.md)                      | `@loaders.gl/geospatial/wkt/index`                                      |
| [![](/next/images/format-logos/ogc-mark.svg)OGCWKT](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/wkt.md)                      | `@loaders.gl/geospatial/wkt/unbundled`                                  |
| [![](/next/images/format-logos/ogc-mark.svg)OGCWKT](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/wkt.md)                      | `@loaders.gl/geospatial/wkt/wkt-format`                                 |
