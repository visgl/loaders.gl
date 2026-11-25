# @loaders.gl/tables

Tabular data loaders, writers, and sources for columnar and row-oriented formats.

Supported formats: Arrow, Feather, GeoArrow, Avro, AVSC, BSON, CSV, TSV, DSV, JSON, GeoJSON, NDJSON, JSONL, NDGeoJSON, GeoJSONL, LDGeoJSON, Lance, ORC, Parquet, GeoParquet, Delta Lake.

Proof of concept for [RFC #4248](https://github.com/visgl/loaders.gl/issues/4248).

The package root exports format descriptors and shared types. Import metadata loaders from
the format subpath, such as `@loaders.gl/tables/parquet`. Import the same loader name from
`@loaders.gl/tables/parquet/bundled` to include its parser eagerly. The bundled Parquet entry
also exports writers, sources, and format helpers.

See the [grouped package guide](../../docs/developer-guide/grouped-packages.md) for examples.

## Sources and credits

See [THIRD-PARTY-NOTICES.md](./THIRD-PARTY-NOTICES.md) for implementation lineage
and applicable notices, and the project-wide [Attributions and Credits](https://loaders.gl/docs/references-and-credits).
