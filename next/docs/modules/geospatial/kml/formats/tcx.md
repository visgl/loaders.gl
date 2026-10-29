Training Center XML

TCX

# Keep activity data with its useful measurements.

TCX describes GPS-backed activities as structured workouts, with laps and measurements such as heart rate, cadence, calories, and elevation. loaders.gl makes the track geometry available alongside that activity context.

[KML module](https://loaders.gl/next/docs/modules/geospatial/kml.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/kml.md)[TCXLoader](https://loaders.gl/next/docs/modules/geospatial/kml/api-reference/tcx-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/kml/api-reference/tcx-loader.md)

TCX[Try It](https://loaders.gl/next/examples/geospatial/kml)[Overview](https://loaders.gl/next/docs/modules/geospatial/kml/formats/kml.md)[Format](https://loaders.gl/next/docs/modules/geospatial/kml/format.md)[GPX](https://loaders.gl/next/docs/modules/geospatial/kml/formats/gpx.md)[TCX](https://loaders.gl/next/docs/modules/geospatial/kml/formats/tcx.md)[KMLLoader](https://loaders.gl/next/docs/modules/geospatial/kml/api-reference/kml-loader.md)[GPXLoader](https://loaders.gl/next/docs/modules/geospatial/kml/api-reference/gpx-loader.md)[TCXLoader](https://loaders.gl/next/docs/modules/geospatial/kml/api-reference/tcx-loader.md)

The TCX document

## An activity model around a GPS track.

Unlike GPX, TCX organizes positions as part of an Activity. This makes room for summaries, laps, sport metadata, and measurements recorded during the effort.

01

Activities

A workout or recorded session

02

Laps

Intervals with summaries and totals

03

Trackpoints

Positions and measurements over time

04

Metrics

Heart rate, cadence, calories, and more

* [TCX - Wikipedia](https://en.wikipedia.org/wiki/Training_Center_XML)

Detailed guide

## TCX format details

The notes below describe TCX as an activity-oriented XML exchange format.

Training Center XML (TCX) is a data exchange format introduced in 2007 as part of Garmin's Training Center product. The XML is similar to GPX since it exchanges GPS tracks, but treats a track as an Activity rather than simply a series of GPS points. TCX provides standards for transferring heart rate, running cadence, bicycle cadence, calories in the detailed track. It also provides summary data in the form of laps.

## Characteristics[​](#characteristics "Direct link to Characteristics")

| Characteristic              | Value                                  |
| --------------------------- | -------------------------------------- |
| File extension              | `.tcx`                                 |
| MIME type                   | `application/vnd.garmin.tcx+xml`       |
| Container                   | XML document                           |
| Coordinate reference system | WGS84 longitude/latitude (`OGC:CRS84`) |

## Feature matrix[​](#feature-matrix "Direct link to Feature matrix")

| Feature                               | Support      | Output                                  |
| ------------------------------------- | ------------ | --------------------------------------- |
| Activities and laps                   | ✅ Supported | Feature properties and line geometry    |
| Multiple tracks per lap               | ✅ Supported | MultiLineString geometry                |
| Trackpoint timestamps                 | ✅ Supported | Coordinate properties                   |
| Elevation                             | ✅ Supported | Z coordinates                           |
| Heart rate, cadence, speed, and power | ✅ Supported | Coordinate properties or aligned arrays |
| Lap summary metrics                   | ✅ Supported | Typed feature properties                |
| Arrow, GeoJSON, and object-row tables | ✅ Supported | Arrow is the default                    |
| Binary geometry output                | ✅ Supported | Select `tcx.shape: 'binary-geometry'`   |
