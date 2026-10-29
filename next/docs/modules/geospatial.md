# @loaders.gl/geospatial

Geospatial vector formats and geometry loader/writer descriptors share one package. Codec and geometry-construction utilities live in independent core subpaths.

| Subpath                                                                             | Formats                             |
| ----------------------------------------------------------------------------------- | ----------------------------------- |
| [kml](https://loaders.gl/next/docs/modules/geospatial/kml.md)                  | KML, GPX, TCX and KMZ               |
| [shapefile](https://loaders.gl/next/docs/modules/geospatial/shapefile.md)      | Shapefile, SHP and DBF              |
| [flatgeobuf](https://loaders.gl/next/docs/modules/geospatial/flatgeobuf.md)    | FlatGeobuf                          |
| [geopackage](https://loaders.gl/next/docs/modules/geospatial/geopackage.md)    | GeoPackage                          |
| [wkt](https://loaders.gl/next/docs/modules/geospatial/wkt.md), `/wkb`, `/twkb` | WKT, WKB, Hex WKB, TWKB and WKT CRS |

Import metadata from the package root or format subpaths. Parser-bearing loaders use named implementation entrypoints, such as `@loaders.gl/geospatial/wkt/wkb-loader`. GeoPackage requires the optional `sql.js` peer dependency. See [Packages](https://loaders.gl/next/docs/packages.md) for installation and loading patterns.
