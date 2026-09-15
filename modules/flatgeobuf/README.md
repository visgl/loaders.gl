# @loaders.gl/flatgeobuf

This module contains a geometry loader for FlatGeobuf.

[loaders.gl](https://loaders.gl/docs) is a collection of framework independent visualization-focused loaders (parsers).

## Features

- `FlatGeobufLoader` returns `arrow-table` output by default and supports `geojson-table`, `binary-geometry`, and `columnar-table` as explicit alternatives.
- `FlatGeobufSourceLoader` provides indexed HTTP range access for remote `.fgb` datasets and can return `geojson`, `binary`, or `arrow` feature tables for a requested bounding box.
