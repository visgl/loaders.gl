# @loaders.gl/geospatial

Geospatial vector formats and geometry loader/writer descriptors share one package. Codec and geometry-construction utilities live in independent core subpaths.

| Subpath | Formats |
| --- | --- |
| [kml](./kml/README.md) | KML, GPX, TCX and KMZ |
| [shapefile](./shapefile/README.md) | Shapefile, SHP and DBF |
| [flatgeobuf](./flatgeobuf/README.md) | FlatGeobuf |
| [geopackage](./geopackage/README.md) | GeoPackage |
| [wkt](./wkt/README.md), `/wkb`, `/twkb` | WKT, WKB, Hex WKB, TWKB and WKT CRS |

Import metadata from the package root or format subpaths. Parser-bearing loaders use named implementation entrypoints, such as `@loaders.gl/geospatial/wkt/wkb-loader`. GeoPackage requires the optional `sql.js` peer dependency. See [Packages](../../packages.md) for installation and loading patterns.
