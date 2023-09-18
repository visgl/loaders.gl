# TWKB

- *[`@loaders.gl/wkt`](/docs/modules/wkt)*
- *[TWKB specification](https://github.com/TWKB/Specification/blob/master/twkb.md)*

TWKB is a format for serializing vector geometry data into a binary byte buffer, similar to [WKB](./wkb) but with an emphasis on minimizing size of the buffer.

## Memory Layout

WKB uses IEEE doubles as the coordinate storage format, so for data with lots of spatially adjacent coordinates (typical for GIS data) it wastes precision, i.e. space on redundant coordinate information:

- TWKB only stores the absolute position once, and stores all other positions as delta values relative to the preceding position.
- TWKB Only use as much address space as is necessary for any given value. Practically this means that "variable length integers" or "varints" are used throughout the specification for storing values in any situation where numbers greater than 128 might be encountered.

## Ecosystem Support

- PostGIS offers a function to return geometries in TWKB format: [ST_AsTWKB](https://postgis.net/docs/ST_AsTWKB.html).

## Versions / History

Unknown.
