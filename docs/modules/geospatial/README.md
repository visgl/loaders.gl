import {FormatLogo} from '@site/src/components/docs/format-logo';
import {ModuleSubpaths} from '@site/src/components/docs/module-subpaths';

# @loaders.gl/geospatial

Geospatial vector formats and geometry loader/writer descriptors share one package. Codec and geometry-construction utilities live in independent core subpaths.

| Format | Subpath | Description |
| --- | --- | --- |
| <FormatLogo slug="kml" /> | [`/kml`](./kml/README.md) | KML |
| — | [`/gpx`](./kml/formats/gpx.md) | GPX |
| — | [`/tcx`](./kml/formats/tcx.md) | TCX |
| <FormatLogo slug="kml" /> | [`/kmz`](./kml/README.md) | KMZ |
| — | [`/shapefile`](./shapefile/README.md) | Shapefile |
| — | [`/shp`](./shapefile/README.md) | SHP geometry |
| — | [`/dbf`](./shapefile/README.md) | DBF attributes |
| <FormatLogo slug="flatgeobuf" /> | [`/flatgeobuf`](./flatgeobuf/README.md) | FlatGeobuf |
| <FormatLogo slug="geopackage" /> | [`/geopackage`](./geopackage/README.md) | GeoPackage |
| <FormatLogo slug="wkt" /> | [`/wkt`](./wkt/README.md) | WKT and WKT CRS |
| <FormatLogo slug="wkb" /> | [`/wkb`](./wkt/formats/wkb.md) | WKB and Hex WKB |
| — | [`/twkb`](./wkt/formats/twkb.md) | Tiny WKB |

Import metadata from the package root or format subpaths. Parser-bearing loaders use named implementation entrypoints, such as `@loaders.gl/geospatial/wkb-loader`. GeoPackage requires the optional `sql.js` peer dependency. See [Get Started](../../developer-guide/get-started.md#install-packages-import-subpaths) for installation and loading patterns.


## Format guides

- [FlatGeobuf](./flatgeobuf/formats/flatgeobuf.md)
- [GeoPackage](./geopackage/formats/geopackage.md)
- [GPX](./kml/formats/gpx.md)
- [KML](./kml/formats/kml.md)
- [TCX](./kml/formats/tcx.md)
- [Shapefile](./shapefile/formats/shapefile.md)
- [TWKB - Tiny Well-Known Binary](./wkt/formats/twkb.md)
- [WKB - Well-Known Binary](./wkt/formats/wkb.md)
- [WKT-CRS - Coordinate Systems](./wkt/formats/wkt-crs.md)
- [Well-Known Text](./wkt/formats/wkt.md)


## Package exports

<ModuleSubpaths module="geospatial" />
