GPS exchange format

GPX

# Carry tracks and waypoints between GPS tools.

GPX is a focused XML format for exchanging routes, tracks, and waypoints. loaders.gl turns those records into geometry tables that can move into mapping, analysis, or Arrow-based pipelines.

[KML module](https://loaders.gl/next/docs/modules/geospatial/kml.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/kml.md)[GPXLoader](https://loaders.gl/next/docs/modules/geospatial/kml/api-reference/gpx-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/kml/api-reference/gpx-loader.md)

GPX[Try It](https://loaders.gl/next/examples/geospatial/kml)[Overview](https://loaders.gl/next/docs/modules/geospatial/kml/formats/kml.md)[Format](https://loaders.gl/next/docs/modules/geospatial/kml/format.md)[GPX](https://loaders.gl/next/docs/modules/geospatial/kml/formats/gpx.md)[TCX](https://loaders.gl/next/docs/modules/geospatial/kml/formats/tcx.md)[KMLLoader](https://loaders.gl/next/docs/modules/geospatial/kml/api-reference/kml-loader.md)[GPXLoader](https://loaders.gl/next/docs/modules/geospatial/kml/api-reference/gpx-loader.md)[TCXLoader](https://loaders.gl/next/docs/modules/geospatial/kml/api-reference/tcx-loader.md)

The GPX document

## A small vocabulary for movement data.

GPX keeps the model intentionally simple: named points, ordered tracks, and routes made from points. Extensions can carry useful metadata such as elevation, time, and heart rate.

01

Waypoints

Named places or points of interest

02

Tracks

Recorded sequences of positions

03

Routes

Planned sequences of route points

04

Extensions

Activity and device-specific metadata

* [GPX - Wikipedia](https://en.wikipedia.org/wiki/GPS_Exchange_Format)

Detailed guide

## GPX format details

The notes below introduce the GPX schema and its role as an interchange format.

GPX, or GPS Exchange Format, is an XML schema designed as a common GPS data format for software applications. It can be used to describe waypoints, tracks, and routes. Location data, elevation, time, and application-specific extensions are stored in XML elements and can be exchanged between GPS devices and software.

## Characteristics[​](#characteristics "Direct link to Characteristics")

| Characteristic              | Value                                  |
| --------------------------- | -------------------------------------- |
| File extension              | `.gpx`                                 |
| MIME type                   | `application/gpx+xml`                  |
| Container                   | XML document                           |
| Coordinate reference system | WGS84 longitude/latitude (`OGC:CRS84`) |

## Feature matrix[​](#feature-matrix "Direct link to Feature matrix")

| Feature                                | Support      | Output                                      |
| -------------------------------------- | ------------ | ------------------------------------------- |
| Waypoints (`wpt`)                      | ✅ Supported | Point features                              |
| Routes (`rte`)                         | ✅ Supported | LineString features                         |
| Tracks (`trk`) and segments (`trkseg`) | ✅ Supported | LineString or MultiLineString features      |
| Elevation and timestamps               | ✅ Supported | Z coordinates and coordinate properties     |
| Common Garmin extensions               | ✅ Supported | Normalized feature or coordinate properties |
| Arrow, GeoJSON, and object-row tables  | ✅ Supported | Arrow is the default                        |
| Binary geometry output                 | ✅ Supported | Select `gpx.shape: 'binary-geometry'`       |
