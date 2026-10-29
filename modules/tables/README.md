# @loaders.gl/tables

Tabular data loaders, writers, and sources for columnar and row-oriented formats.

Supported formats: Arrow, Feather, GeoArrow, Avro, AVSC, BSON, CSV, TSV, DSV, Excel, XLS, XLSB, XLSM, XLSX, JSON, GeoJSON, NDJSON, JSONL, NDGeoJSON, GeoJSONL, LDGeoJSON, Lance, ORC, Parquet, GeoParquet, Delta Lake.

Proof of concept for [RFC #4248](https://github.com/visgl/loaders.gl/issues/4248).

This package owns the table format implementations listed above. Its root exports metadata-only loaders, writer APIs, and shared types. Import a format subpath for its parser-bearing loader. Existing format packages forward to this package.

See [the POC guide](../../docs/developer-guide/grouped-packages.md) for examples, compatibility limits, and dependency tradeoffs.

The full table group includes Arrow/GeoArrow, Avro, BSON, CSV, Excel, JSON/GeoJSON/NDJSON/NDGeoJSON, Lance, ORC, and Parquet/GeoParquet. Import metadata from the root and parser-bearing loaders from the corresponding format subpath. See the [grouped package guide](../../docs/developer-guide/grouped-packages.md).

## Sources and credits

See [THIRD-PARTY-NOTICES.md](./THIRD-PARTY-NOTICES.md) for implementation lineage
and applicable notices, and the project-wide [References and credits](https://loaders.gl/docs/references-and-credits).
