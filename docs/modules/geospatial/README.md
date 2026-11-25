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
| — | [`/adsb`](./adsb/README.md) | 🧪 ADS-B aircraft state snapshots (JSON) |
| — | [`/ais`](./ais/README.md) | 🧪 AIS maritime reports (NMEA text) |
| — | [`/gtfs`](./gtfs/README.md) | 🧪 GTFS Schedule tables, stops, and shapes (ZIP) |
| — | [`/gtfs-realtime`](./gtfs-realtime/README.md) | 🧪 GTFS Realtime vehicle positions, trip updates, and alerts (protobuf) |
| — | [`/omm`](./omm/README.md) | 🧪 CCSDS OMM satellite orbit mean elements (JSON, KVN) |
| — | [`/tle`](./tle/README.md) | 🧪 Two-line element sets (TLE) |

Import metadata from format subpaths. Import parser-bearing loaders from bundled subpaths, such as `@loaders.gl/geospatial/wkb/bundled`. GeoPackage requires the optional `sql.js` peer dependency. See [Get Started](../../developer-guide/get-started.md#install-packages-import-subpaths) for installation and loading patterns.


## Format guides

- [ADS-B aircraft state JSON](./adsb/formats/adsb.md)
- [AIS - Automatic Identification System](./ais/formats/ais.md)
- [GTFS Schedule ZIP](./gtfs/formats/gtfs.md)
- [GTFS Realtime protobuf](./gtfs-realtime/formats/gtfs-realtime.md)
- [FlatGeobuf](./flatgeobuf/formats/flatgeobuf.md)
- [GeoPackage](./geopackage/formats/geopackage.md)
- [GPX](./kml/formats/gpx.md)
- [KML](./kml/formats/kml.md)
- [OMM - Orbit Mean-Elements Message](./omm/formats/omm.md)
- [TCX](./kml/formats/tcx.md)
- [Shapefile](./shapefile/formats/shapefile.md)
- [TLE - Two-Line Element Set](./tle/formats/tle.md)
- [TWKB - Tiny Well-Known Binary](./wkt/formats/twkb.md)
- [WKB - Well-Known Binary](./wkt/formats/wkb.md)
- [WKT-CRS - Coordinate Systems](./wkt/formats/wkt-crs.md)
- [Well-Known Text](./wkt/formats/wkt.md)


## Package exports

<ModuleSubpaths module="geospatial" />
