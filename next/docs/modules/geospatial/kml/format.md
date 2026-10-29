XML geospatial formats

![](/next/images/format-logos/ogc-mark.svg)OGCKML

# Bring annotated tracks into one geometry path.

KML, KMZ, GPX, and TCX use related XML foundations but describe different kinds of geographic data. loaders.gl preserves their useful metadata while returning common geometry and table shapes for applications.

[KML module](https://loaders.gl/next/docs/modules/geospatial/kml.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/kml.md)[KMLLoader](https://loaders.gl/next/docs/modules/geospatial/kml/api-reference/kml-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/kml/api-reference/kml-loader.md)[GIS category](https://loaders.gl/next/docs/specifications/category-gis.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/specifications/category-gis.md)

![](/next/images/format-logos/ogc-mark.svg)OGCKML[Try It](https://loaders.gl/next/examples/geospatial/kml)[Overview](https://loaders.gl/next/docs/modules/geospatial/kml/formats/kml.md)[Format](https://loaders.gl/next/docs/modules/geospatial/kml/format.md)[GPX](https://loaders.gl/next/docs/modules/geospatial/kml/formats/gpx.md)[TCX](https://loaders.gl/next/docs/modules/geospatial/kml/formats/tcx.md)[KMLLoader](https://loaders.gl/next/docs/modules/geospatial/kml/api-reference/kml-loader.md)[GPXLoader](https://loaders.gl/next/docs/modules/geospatial/kml/api-reference/gpx-loader.md)[TCXLoader](https://loaders.gl/next/docs/modules/geospatial/kml/api-reference/tcx-loader.md)

Geographic document path

## Keep the track data useful after XML.

Each format has its own document vocabulary, but the application usually needs coordinates, features, properties, and timing. The loaders normalize those common pieces without discarding source metadata.

01

KML

Placemarks, paths, regions, styles, and Earth-browser metadata.

02

GPX

Tracks, routes, waypoints, and elevation/time fields.

03

TCX

Training activity laps, tracks, and workout metadata.

04

Output

GeoJSON, geometry tables, object rows, or Arrow tables.

Detailed guide

## KML, GPX, and TCX details

The reference below compares the three XML formats, loader output shapes, metadata behavior, and supported entry points.

| Characteristic       | Value                                                                                                                                                                                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| File Formats         | [KML and KMZ](https://loaders.gl/next/docs/modules/geospatial/kml/formats/kml.md), [GPX](https://loaders.gl/next/docs/modules/geospatial/kml/formats/gpx.md), [TCX](https://loaders.gl/next/docs/modules/geospatial/kml/formats/tcx.md) |
| Data Format          | [Geometry Tables](https://loaders.gl/next/docs/specifications/category-gis.md), GeoJSON                                                                                                                                                           |
| File Extensions      | `.kml`, `.kmz`, `.gpx`, `.tcx`                                                                                                                                                                                                                         |
| MIME Types           | `application/vnd.google-earth.kml+xml`, `application/vnd.google-earth.kmz`, `application/gpx+xml`, `application/vnd.garmin.tcx+xml`                                                                                                                    |
| File Type            | Text/XML                                                                                                                                                                                                                                               |
| Loader APIs          | `load`, `parse`, `parseTextSync`                                                                                                                                                                                                                       |
| Loader Worker Thread | ❌ No                                                                                                                                                                                                                                                  |
| Loader Streaming     | ❌ No                                                                                                                                                                                                                                                  |

## Loaders[​](#loaders "Direct link to Loaders")

[Loader**KMLLoader**Loads Keyhole Markup Language documents as loaders.gl geometry tables.Output: GeoJSONTable, ObjectRowTable, ArrowTableAPIs: load, parse, parseTextSync](https://loaders.gl/next/docs/modules/geospatial/kml/api-reference/kml-loader)[Loader**GPXLoader**Loads GPS Exchange Format tracks, routes, and waypoints as loaders.gl geometry tables.Output: GeoJSONTable, ObjectRowTable, ArrowTable, BinaryFeatureCollectionAPIs: load, parse, parseTextSync](https://loaders.gl/next/docs/modules/geospatial/kml/api-reference/gpx-loader)[Loader**TCXLoader**Loads Training Center XML activity files as loaders.gl geometry tables.Output: GeoJSONTable, ObjectRowTable, ArrowTable, BinaryFeatureCollectionAPIs: load, parse, parseTextSync](https://loaders.gl/next/docs/modules/geospatial/kml/api-reference/tcx-loader)

## XML-Based Formats[​](#xml-based-formats "Direct link to XML-Based Formats")

KML, GPX, and TCX are XML-based geospatial interchange formats. They are text files that describe placemarks, waypoints, routes, tracks, or activities using format-specific XML elements.

## Geospatial Output[​](#geospatial-output "Direct link to Geospatial Output")

The KML module converts these documents into loaders.gl geometry table shapes for application code. The default output is an `ArrowTable`; GeoJSON and object-row tables remain available through the format-specific `shape` option.
