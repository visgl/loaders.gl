# @loaders.gl/geospatial

Geospatial vector formats and geometry loader/writer descriptors share one package. Codec and geometry-construction utilities live in independent core subpaths.

| Format                                                                                                                                            | Subpath                                                                             | Description                                            |
| ------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------ |
| [![](/next/images/format-logos/ogc-mark.svg)OGCKML](https://loaders.gl/next/docs/modules/geospatial/kml/formats/kml.md)                      | [`/kml`](https://loaders.gl/next/docs/modules/geospatial/kml.md)               | KML                                                    |
| —                                                                                                                                                 | [`/gpx`](https://loaders.gl/next/docs/modules/geospatial/kml/formats/gpx.md)   | GPX                                                    |
| —                                                                                                                                                 | [`/tcx`](https://loaders.gl/next/docs/modules/geospatial/kml/formats/tcx.md)   | TCX                                                    |
| [![](/next/images/format-logos/ogc-mark.svg)OGCKML](https://loaders.gl/next/docs/modules/geospatial/kml/formats/kml.md)                      | [`/kmz`](https://loaders.gl/next/docs/modules/geospatial/kml.md)               | KMZ                                                    |
| —                                                                                                                                                 | [`/shapefile`](https://loaders.gl/next/docs/modules/geospatial/shapefile.md)   | Shapefile                                              |
| —                                                                                                                                                 | [`/shp`](https://loaders.gl/next/docs/modules/geospatial/shapefile.md)         | SHP geometry                                           |
| —                                                                                                                                                 | [`/dbf`](https://loaders.gl/next/docs/modules/geospatial/shapefile.md)         | DBF attributes                                         |
| [![](/next/images/format-logos/flatgeobuf-logo.png)](https://loaders.gl/next/docs/modules/geospatial/flatgeobuf/formats/flatgeobuf.md)       | [`/flatgeobuf`](https://loaders.gl/next/docs/modules/geospatial/flatgeobuf.md) | FlatGeobuf                                             |
| [![](/next/images/format-logos/ogc-mark.svg)OGCGeoPackage](https://loaders.gl/next/docs/modules/geospatial/geopackage/formats/geopackage.md) | [`/geopackage`](https://loaders.gl/next/docs/modules/geospatial/geopackage.md) | GeoPackage                                             |
| [![](/next/images/format-logos/ogc-mark.svg)OGCWKT](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/wkt.md)                      | [`/wkt`](https://loaders.gl/next/docs/modules/geospatial/wkt.md)               | WKT and WKT CRS                                        |
| [![](/next/images/format-logos/ogc-mark.svg)OGCWKB](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/wkb.md)                      | [`/wkb`](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/wkb.md)   | WKB and Hex WKB                                        |
| —                                                                                                                                                 | [`/twkb`](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/twkb.md) | Tiny WKB                                               |
| —                                                                                                                                                 | [`/omm`](https://loaders.gl/next/docs/modules/geospatial/omm.md)               | 🧪 CCSDS OMM satellite orbit mean elements (JSON, KVN) |
| —                                                                                                                                                 | [`/tle`](https://loaders.gl/next/docs/modules/geospatial/tle.md)               | 🧪 Two-line element sets (TLE)                         |

Import metadata from format subpaths. Import parser-bearing loaders from bundled subpaths, such as `@loaders.gl/geospatial/wkb/bundled`. GeoPackage requires the optional `sql.js` peer dependency. See [Get Started](https://loaders.gl/next/docs/developer-guide/get-started.md#install-packages-import-subpaths) for installation and loading patterns.

## Format guides[​](#format-guides "Direct link to Format guides")

* [FlatGeobuf](https://loaders.gl/next/docs/modules/geospatial/flatgeobuf/formats/flatgeobuf.md)
* [GeoPackage](https://loaders.gl/next/docs/modules/geospatial/geopackage/formats/geopackage.md)
* [GPX](https://loaders.gl/next/docs/modules/geospatial/kml/formats/gpx.md)
* [KML](https://loaders.gl/next/docs/modules/geospatial/kml/formats/kml.md)
* [OMM - Orbit Mean-Elements Message](https://loaders.gl/next/docs/modules/geospatial/omm/formats/omm.md)
* [TCX](https://loaders.gl/next/docs/modules/geospatial/kml/formats/tcx.md)
* [Shapefile](https://loaders.gl/next/docs/modules/geospatial/shapefile/formats/shapefile.md)
* [TLE - Two-Line Element Set](https://loaders.gl/next/docs/modules/geospatial/tle/formats/tle.md)
* [TWKB - Tiny Well-Known Binary](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/twkb.md)
* [WKB - Well-Known Binary](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/wkb.md)
* [WKT-CRS - Coordinate Systems](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/wkt-crs.md)
* [Well-Known Text](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/wkt.md)

## Package exports[​](#package-exports "Direct link to Package exports")

All exported subpaths (<!-- -->37<!-- -->)

These are the package's public exports, including format entry points, parsers, writers, sources, and worker assets.

| Format                                                                                                                                            | Import subpath                               |
| ------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
|                                                                                                                                                   | `@loaders.gl/geospatial/dbf`                 |
|                                                                                                                                                   | `@loaders.gl/geospatial/dbf/bundled`         |
| [![](/next/images/format-logos/flatgeobuf-logo.png)](https://loaders.gl/next/docs/modules/geospatial/flatgeobuf/formats/flatgeobuf.md)       | `@loaders.gl/geospatial/flatgeobuf`          |
| [![](/next/images/format-logos/flatgeobuf-logo.png)](https://loaders.gl/next/docs/modules/geospatial/flatgeobuf/formats/flatgeobuf.md)       | `@loaders.gl/geospatial/flatgeobuf/api`      |
| [![](/next/images/format-logos/flatgeobuf-logo.png)](https://loaders.gl/next/docs/modules/geospatial/flatgeobuf/formats/flatgeobuf.md)       | `@loaders.gl/geospatial/flatgeobuf/bundled`  |
| [![](/next/images/format-logos/ogc-mark.svg)OGCGeoPackage](https://loaders.gl/next/docs/modules/geospatial/geopackage/formats/geopackage.md) | `@loaders.gl/geospatial/geopackage`          |
| [![](/next/images/format-logos/ogc-mark.svg)OGCGeoPackage](https://loaders.gl/next/docs/modules/geospatial/geopackage/formats/geopackage.md) | `@loaders.gl/geospatial/geopackage/api`      |
| [![](/next/images/format-logos/ogc-mark.svg)OGCGeoPackage](https://loaders.gl/next/docs/modules/geospatial/geopackage/formats/geopackage.md) | `@loaders.gl/geospatial/geopackage/bundled`  |
|                                                                                                                                                   | `@loaders.gl/geospatial/gpx`                 |
|                                                                                                                                                   | `@loaders.gl/geospatial/gpx/api`             |
|                                                                                                                                                   | `@loaders.gl/geospatial/gpx/bundled`         |
| [![](/next/images/format-logos/ogc-mark.svg)OGCKML](https://loaders.gl/next/docs/modules/geospatial/kml/formats/kml.md)                      | `@loaders.gl/geospatial/kml`                 |
| [![](/next/images/format-logos/ogc-mark.svg)OGCKML](https://loaders.gl/next/docs/modules/geospatial/kml/formats/kml.md)                      | `@loaders.gl/geospatial/kml/api`             |
| [![](/next/images/format-logos/ogc-mark.svg)OGCKML](https://loaders.gl/next/docs/modules/geospatial/kml/formats/kml.md)                      | `@loaders.gl/geospatial/kml/bundled`         |
|                                                                                                                                                   | `@loaders.gl/geospatial/kmz`                 |
|                                                                                                                                                   | `@loaders.gl/geospatial/kmz/api`             |
|                                                                                                                                                   | `@loaders.gl/geospatial/kmz/bundled`         |
|                                                                                                                                                   | `@loaders.gl/geospatial/omm`                 |
|                                                                                                                                                   | `@loaders.gl/geospatial/omm/bundled`         |
|                                                                                                                                                   | `@loaders.gl/geospatial/shapefile`           |
|                                                                                                                                                   | `@loaders.gl/geospatial/shapefile-worker.js` |
|                                                                                                                                                   | `@loaders.gl/geospatial/shapefile/api`       |
|                                                                                                                                                   | `@loaders.gl/geospatial/shapefile/bundled`   |
|                                                                                                                                                   | `@loaders.gl/geospatial/shp`                 |
|                                                                                                                                                   | `@loaders.gl/geospatial/shp/api`             |
|                                                                                                                                                   | `@loaders.gl/geospatial/shp/bundled`         |
|                                                                                                                                                   | `@loaders.gl/geospatial/tcx`                 |
|                                                                                                                                                   | `@loaders.gl/geospatial/tcx/api`             |
|                                                                                                                                                   | `@loaders.gl/geospatial/tcx/bundled`         |
|                                                                                                                                                   | `@loaders.gl/geospatial/tle`                 |
|                                                                                                                                                   | `@loaders.gl/geospatial/tle/bundled`         |
| [![](/next/images/format-logos/ogc-mark.svg)OGCWKB](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/wkb.md)                      | `@loaders.gl/geospatial/wkb`                 |
| [![](/next/images/format-logos/ogc-mark.svg)OGCWKB](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/wkb.md)                      | `@loaders.gl/geospatial/wkb/api`             |
| [![](/next/images/format-logos/ogc-mark.svg)OGCWKB](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/wkb.md)                      | `@loaders.gl/geospatial/wkb/bundled`         |
| [![](/next/images/format-logos/ogc-mark.svg)OGCWKT](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/wkt.md)                      | `@loaders.gl/geospatial/wkt`                 |
| [![](/next/images/format-logos/ogc-mark.svg)OGCWKT](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/wkt.md)                      | `@loaders.gl/geospatial/wkt-worker.js`       |
| [![](/next/images/format-logos/ogc-mark.svg)OGCWKT](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/wkt.md)                      | `@loaders.gl/geospatial/wkt/bundled`         |
