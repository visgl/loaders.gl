# @loaders.gl/tables

Proof of concept for [RFC #4248](https://github.com/visgl/loaders.gl/issues/4248).

This package owns the CSV, Avro, BSON, and Excel implementations. Its root exports metadata-only loaders, writer APIs, and shared types. Import a format subpath for its parser-bearing loader. Existing format packages forward to this package.

See [the POC guide](../../docs/developer-guide/grouped-packages.md) for examples, compatibility limits, and dependency tradeoffs.

The full table group includes Arrow/GeoArrow, Avro, BSON, CSV, Excel, JSON/GeoJSON/NDJSON/NDGeoJSON, Lance, ORC, and Parquet/GeoParquet. Import metadata from the root and parser-bearing loaders from the corresponding format subpath. See the [grouped package guide](../../docs/developer-guide/grouped-packages.md).

## Sources and credits

See [THIRD-PARTY-NOTICES.md](./THIRD-PARTY-NOTICES.md) for implementation lineage
and applicable notices, and the project-wide [References and credits](https://loaders.gl/docs/references-and-credits).
