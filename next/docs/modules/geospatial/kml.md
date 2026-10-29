KML module

![](/next/images/format-logos/ogc-mark.svg)OGCKML

# Bring map and track files into one data path.

`@loaders.gl/geospatial/kml` reads KML, GPX, and TCX documents and converts their geographic content into application-ready data. The formats differ in origin, but share an XML boundary and a geospatial use case.

[KML format](https://loaders.gl/next/docs/modules/geospatial/kml/formats/kml.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/kml/formats/kml.md)[GPX loader](https://loaders.gl/next/docs/modules/geospatial/kml/api-reference/gpx-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/kml/api-reference/gpx-loader.md)[TCX loader](https://loaders.gl/next/docs/modules/geospatial/kml/api-reference/tcx-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/kml/api-reference/tcx-loader.md)

The geographic XML path

## Read the document. Extract the track or feature data.

KML carries map annotations and styling, while GPX and TCX describe tracks, routes, and activity records. The module’s loaders translate these document shapes into usable JavaScript data.

01

KML

Map features, placemarks, and overlays

02

GPX

Tracks, routes, and waypoints

03

TCX

Fitness activity and training records

04

Decoder

GeoJSON-oriented document conversion

Detailed guide

## Format and loader details

The reference below covers installation, individual format pages, loader entry points, external references, and attribution.

The `@loaders.gl/geospatial/kml` module supports the KML, KMZ, GPX, and TCX formats.

KML (Keyhole Markup Language) is an XML-based file format used to display geographic data in an Earth browser such as Google Earth (originally named "Keyhole Earth Viewer"). It can be used with any 2D or 3D maps.

GPX (GPS Exchange Format) is an XML-based file format commonly used by GPS tracking software.

TCX (Training Center XML) is an XML-based file format commonly used by fitness watches or similar GPS tracking software.

All four parsers use the shared `@loaders.gl/xml` parser and return Arrow tables by default. KML and KMZ support is described in the [KML and KMZ format page](https://loaders.gl/next/docs/modules/geospatial/kml/formats/kml.md); the [GPX](https://loaders.gl/next/docs/modules/geospatial/kml/formats/gpx.md) and [TCX](https://loaders.gl/next/docs/modules/geospatial/kml/formats/tcx.md) pages describe the sports-track formats.

References:

* [Keyhole Markup Language - Wikipedia](https://en.wikipedia.org/wiki/Keyhole_Markup_Language)
* [KML Tutorial - Google](https://developers.google.com/kml/documentation/kml_tut)
* [GPX - Wikipedia](https://en.wikipedia.org/wiki/GPS_Exchange_Format)
* [TCX - Wikipedia](https://en.wikipedia.org/wiki/Training_Center_XML)

## Installation[​](#installation "Direct link to Installation")

```
npm install @loaders.gl/core @loaders.gl/geospatial
```
