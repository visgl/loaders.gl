Coordinate reference syntax

![](/next/images/format-logos/ogc-mark.svg)OGCWKT-CRS

# Describe where the coordinates live.

WKT-CRS is the standards-based text grammar for coordinate reference systems and their transformations. It gives geospatial data a precise spatial frame before reprojection or rendering begins.

[WKT module](https://loaders.gl/next/docs/modules/geospatial/wkt.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/wkt.md)[CRS guide](https://loaders.gl/next/docs/developer-guide/coordinate-reference-systems.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/coordinate-reference-systems.md)[WKT CRS loader](https://loaders.gl/next/docs/modules/geospatial/wkt/api-reference/wkt-crs-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/wkt/api-reference/wkt-crs-loader.md)

Coordinate meaning

## Preserve first. Transform deliberately.

A loader can retain the coordinate definition without changing a single value. Reprojection is a separate, explicit operation with a named target.

Source data

12.4924, 41.8902

GeoParquetGeoArrowWKT

discove&#x72;**→**

CRS definition

**EPSG:4326**

identifier · axis order · epoch · provenance

choos&#x65;**→**

Preserve**Same values + CRS**

Transform**New values + target CRS**

The CRS path

## Parse the authority. Preserve the axes. Reproject deliberately.

A CRS definition describes coordinate meaning, units, axes, datums, and transformations. Parsing the definition is separate from choosing whether and how coordinates should be reprojected.

01

Definition

Geographic, projected, vertical, or compound CRS

02

Axes

Names, directions, units, and order

03

Authority

EPSG, OGC, or other identifiers and metadata

04

Next step

Use the parsed CRS in an explicit reprojection policy

* *[`@loaders.gl/geospatial/wkt`](https://loaders.gl/next/docs/modules/geospatial/wkt.md)*
* *[OGC Standard](https://www.ogc.org/standards/wkt-crs)*
* *[Wikipedia Page](https://en.wikipedia.org/wiki/Well-known_text_representation_of_coordinate_reference_systems)*

Well-known text representation of coordinate reference systems (WKT or WKT-CRS) is a text markup language for representing spatial reference systems and transformations between spatial reference systems. The formats were originally defined by the Open Geospatial Consortium (OGC) and described in their Simple Feature Access and Well-known text representation of coordinate reference systems specifications. The current standard definition is ISO 19162:2019.

Detailed guide

## CRS grammar and interoperability details

The reference below covers WKT-CRS revisions, CRS components, authority metadata, axis handling, and loaders.gl integration.

See [Coordinate Reference Systems](https://loaders.gl/next/docs/developer-guide/coordinate-reference-systems.md) for the loaders.gl type model, format support matrix, and reprojection roadmap.

## Version History[​](#version-history "Direct link to Version History")

| Name                  | Year   | Description                                                  | ISO              |
| --------------------- | ------ | ------------------------------------------------------------ | ---------------- |
| WKT                   | 1999   | As initially defined by the Open Geospatial Consortium (OGC) | —                |
| "WKT 1"               | (2001  | WKT was extended in 2001. Sometimes known as "WKT 1".        | ISO 19125-1:2004 |
| "WKT 2" / "WKT-CRS 1" | (2015) | Addresses new requirements and inconsistencies in WKT 1.     | ISO 19162:2015   |
| "WKT-CRS 2"           | (2018) | A newer revision.                                            | ISO 19162:2019   |
