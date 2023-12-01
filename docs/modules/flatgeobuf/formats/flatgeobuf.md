# FlatGeobuf

- *[`@loaders.gl/flatgeobuf`](/docs/moodules/flatgeobuf)*
- *[FlatGeobuf](http://flatgeobuf.org/)*

FlatGeobuf is a binary (FlatBuffers-encoded) format that defines geospatial geometries. It is row-oriented rather than columnar (like GeoParquet and GeoArrow) and offers a different set of trade-offs.

FlatGeobuf was inspired by [geobuf](https://github.com/mapbox/geobuf) and [flatbush](https://github.com/mourner/flatbush). 

## Characteristics 

- binary
- row oriented
- supports appends, but no random writes

Goals are to be suitable for large volumes of static data, significantly faster than legacy formats without size limitations for contents or metainformation and to be suitable for streaming/random access.

