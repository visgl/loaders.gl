# @loaders.gl/geospatial

Geospatial vector formats and geometry loader/writer descriptors share one package. Codec and geometry-construction utilities live in independent core subpaths.

| Format                                                                                                                             | Subpath                                                                   | Description     |
| ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | --------------- |
| [![](/images/format-logos/ogc-mark.svg)OGCKML](https://loaders.gl/docs/modules/geospatial/kml/formats/kml.md)                      | [`/kml`](https://loaders.gl/docs/modules/geospatial/kml.md)               | KML             |
| —                                                                                                                                  | [`/gpx`](https://loaders.gl/docs/modules/geospatial/kml/formats/gpx.md)   | GPX             |
| —                                                                                                                                  | [`/tcx`](https://loaders.gl/docs/modules/geospatial/kml/formats/tcx.md)   | TCX             |
| [![](/images/format-logos/ogc-mark.svg)OGCKML](https://loaders.gl/docs/modules/geospatial/kml/formats/kml.md)                      | [`/kmz`](https://loaders.gl/docs/modules/geospatial/kml.md)               | KMZ             |
| —                                                                                                                                  | [`/shapefile`](https://loaders.gl/docs/modules/geospatial/shapefile.md)   | Shapefile       |
| —                                                                                                                                  | [`/shp`](https://loaders.gl/docs/modules/geospatial/shapefile.md)         | SHP geometry    |
| —                                                                                                                                  | [`/dbf`](https://loaders.gl/docs/modules/geospatial/shapefile.md)         | DBF attributes  |
| [![](/images/format-logos/flatgeobuf-logo.png)](https://loaders.gl/docs/modules/geospatial/flatgeobuf/formats/flatgeobuf.md)       | [`/flatgeobuf`](https://loaders.gl/docs/modules/geospatial/flatgeobuf.md) | FlatGeobuf      |
| [![](/images/format-logos/ogc-mark.svg)OGCGeoPackage](https://loaders.gl/docs/modules/geospatial/geopackage/formats/geopackage.md) | [`/geopackage`](https://loaders.gl/docs/modules/geospatial/geopackage.md) | GeoPackage      |
| [![](/images/format-logos/ogc-mark.svg)OGCWKT](https://loaders.gl/docs/modules/geospatial/wkt/formats/wkt.md)                      | [`/wkt`](https://loaders.gl/docs/modules/geospatial/wkt.md)               | WKT and WKT CRS |
| [![](/images/format-logos/ogc-mark.svg)OGCWKB](https://loaders.gl/docs/modules/geospatial/wkt/formats/wkb.md)                      | [`/wkb`](https://loaders.gl/docs/modules/geospatial/wkt/formats/wkb.md)   | WKB and Hex WKB |
| —                                                                                                                                  | [`/twkb`](https://loaders.gl/docs/modules/geospatial/wkt/formats/twkb.md) | Tiny WKB        |

Import metadata from the package root or format subpaths. Parser-bearing loaders use named implementation entrypoints, such as `@loaders.gl/geospatial/wkb`. GeoPackage requires the optional `sql.js` peer dependency. See [Get Started](https://loaders.gl/docs/developer-guide/get-started.md#install-packages-import-subpaths) for installation and loading patterns.

## Format guides[​](#format-guides "Direct link to Format guides")

* [FlatGeobuf](https://loaders.gl/docs/modules/geospatial/flatgeobuf/formats/flatgeobuf.md)
* [GeoPackage](https://loaders.gl/docs/modules/geospatial/geopackage/formats/geopackage.md)
* [GPX](https://loaders.gl/docs/modules/geospatial/kml/formats/gpx.md)
* [KML](https://loaders.gl/docs/modules/geospatial/kml/formats/kml.md)
* [TCX](https://loaders.gl/docs/modules/geospatial/kml/formats/tcx.md)
* [Shapefile](https://loaders.gl/docs/modules/geospatial/shapefile/formats/shapefile.md)
* [TWKB - Tiny Well-Known Binary](https://loaders.gl/docs/modules/geospatial/wkt/formats/twkb.md)
* [WKB - Well-Known Binary](https://loaders.gl/docs/modules/geospatial/wkt/formats/wkb.md)
* [WKT-CRS - Coordinate Systems](https://loaders.gl/docs/modules/geospatial/wkt/formats/wkt-crs.md)
* [Well-Known Text](https://loaders.gl/docs/modules/geospatial/wkt/formats/wkt.md)

## Package exports[​](#package-exports "Direct link to Package exports")

All exported subpaths (<!-- -->24<!-- -->)

These are the package's public exports, including format entry points, parsers, writers, sources, and worker assets.

| Format                                                                                                                             | Import subpath                               |
| ---------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
|                                                                                                                                    | `@loaders.gl/geospatial/dbf`                 |
|                                                                                                                                    | `@loaders.gl/geospatial/dbf/bundled`         |
| [![](/images/format-logos/flatgeobuf-logo.png)](https://loaders.gl/docs/modules/geospatial/flatgeobuf/formats/flatgeobuf.md)       | `@loaders.gl/geospatial/flatgeobuf`          |
| [![](/images/format-logos/flatgeobuf-logo.png)](https://loaders.gl/docs/modules/geospatial/flatgeobuf/formats/flatgeobuf.md)       | `@loaders.gl/geospatial/flatgeobuf/bundled`  |
| [![](/images/format-logos/ogc-mark.svg)OGCGeoPackage](https://loaders.gl/docs/modules/geospatial/geopackage/formats/geopackage.md) | `@loaders.gl/geospatial/geopackage`          |
| [![](/images/format-logos/ogc-mark.svg)OGCGeoPackage](https://loaders.gl/docs/modules/geospatial/geopackage/formats/geopackage.md) | `@loaders.gl/geospatial/geopackage/bundled`  |
|                                                                                                                                    | `@loaders.gl/geospatial/gpx`                 |
|                                                                                                                                    | `@loaders.gl/geospatial/gpx/bundled`         |
| [![](/images/format-logos/ogc-mark.svg)OGCKML](https://loaders.gl/docs/modules/geospatial/kml/formats/kml.md)                      | `@loaders.gl/geospatial/kml`                 |
| [![](/images/format-logos/ogc-mark.svg)OGCKML](https://loaders.gl/docs/modules/geospatial/kml/formats/kml.md)                      | `@loaders.gl/geospatial/kml/bundled`         |
|                                                                                                                                    | `@loaders.gl/geospatial/kmz`                 |
|                                                                                                                                    | `@loaders.gl/geospatial/kmz/bundled`         |
|                                                                                                                                    | `@loaders.gl/geospatial/shapefile`           |
|                                                                                                                                    | `@loaders.gl/geospatial/shapefile-worker.js` |
|                                                                                                                                    | `@loaders.gl/geospatial/shapefile/bundled`   |
|                                                                                                                                    | `@loaders.gl/geospatial/shp`                 |
|                                                                                                                                    | `@loaders.gl/geospatial/shp/bundled`         |
|                                                                                                                                    | `@loaders.gl/geospatial/tcx`                 |
|                                                                                                                                    | `@loaders.gl/geospatial/tcx/bundled`         |
| [![](/images/format-logos/ogc-mark.svg)OGCWKB](https://loaders.gl/docs/modules/geospatial/wkt/formats/wkb.md)                      | `@loaders.gl/geospatial/wkb`                 |
| [![](/images/format-logos/ogc-mark.svg)OGCWKB](https://loaders.gl/docs/modules/geospatial/wkt/formats/wkb.md)                      | `@loaders.gl/geospatial/wkb/bundled`         |
| [![](/images/format-logos/ogc-mark.svg)OGCWKT](https://loaders.gl/docs/modules/geospatial/wkt/formats/wkt.md)                      | `@loaders.gl/geospatial/wkt`                 |
| [![](/images/format-logos/ogc-mark.svg)OGCWKT](https://loaders.gl/docs/modules/geospatial/wkt/formats/wkt.md)                      | `@loaders.gl/geospatial/wkt-worker.js`       |
| [![](/images/format-logos/ogc-mark.svg)OGCWKT](https://loaders.gl/docs/modules/geospatial/wkt/formats/wkt.md)                      | `@loaders.gl/geospatial/wkt/bundled`         |
