Geometry binary format

![](/next/images/format-logos/ogc-mark.svg)OGCWKB

# Smaller geometry records for constrained links.

Tiny Well-Known Binary (TWKB) is a compact WKB variant that uses quantized coordinates, deltas, and variable-length integers to reduce the bytes needed for neighboring geometry points.

[WKT module](https://loaders.gl/next/docs/modules/geospatial/wkt.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/wkt.md)[TWKBLoader](https://loaders.gl/next/docs/modules/geospatial/wkt/api-reference/twkb-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/wkt/api-reference/twkb-loader.md)[TWKBWriter](https://loaders.gl/next/docs/modules/geospatial/wkt/api-reference/twkb-writer.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/geospatial/wkt/api-reference/twkb-writer.md)

The TWKB record path

## Store the first position. Make nearby points inexpensive.

TWKB is useful when geometry is spatially local and transport size matters. The decoder reconstructs the coordinate sequence from compact integer deltas before exposing the common geometry result.

01

Coordinate model

Quantized integer coordinates and deltas

02

Encoding

Variable-length integers with zigzag values

03

Typical use

Compact vector geometry over APIs or mobile links

04

Related formats

WKB for general binary geometry; WKT for readable text

Detailed guide

## TWKB layout and support details

The reference below covers the compact encoding model, ecosystem support, and the loaders.gl APIs for reading and writing TWKB geometry.

* *[`@loaders.gl/geospatial/wkt`](https://loaders.gl/next/docs/modules/geospatial/wkt.md)*
* *[TWKB specification](https://github.com/TWKB/Specification/blob/master/twkb.md)*

TWKB is a format for serializing vector geometry data into a binary byte buffer, similar to [WKB](https://loaders.gl/next/docs/modules/geospatial/wkt/formats/wkb.md) but with an emphasis on minimizing size of the buffer.

## Memory Layout[​](#memory-layout "Direct link to Memory Layout")

WKB uses IEEE doubles as the coordinate storage format, so for data with lots of spatially adjacent coordinates (typical for GIS data) it wastes precision, i.e. space on redundant coordinate information:

* TWKB only stores the absolute position once, and stores all other positions as delta values relative to the preceding position.
* TWKB Only use as much address space as is necessary for any given value. Practically this means that "variable length integers" or "varints" are used throughout the specification for storing values in any situation where numbers greater than 128 might be encountered.

## Ecosystem Support[​](#ecosystem-support "Direct link to Ecosystem Support")

* PostGIS offers a function to return geometries in TWKB format: [ST\_AsTWKB](https://postgis.net/docs/ST_AsTWKB.html).

## Versions / History[​](#versions--history "Direct link to Versions / History")

Unknown.
