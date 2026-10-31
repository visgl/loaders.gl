# @loaders.gl/tables

Table and record formats share one package, with format-specific metadata and parser entrypoints.

| Subpath | Formats |
| --- | --- |
| [arrow](./arrow/README.md) | Apache Arrow and GeoArrow |
| [csv](./csv/README.md) | CSV |
| [json](./json/README.md) | JSON, GeoJSON and newline-delimited variants |
| [parquet](./parquet/README.md) | Parquet and GeoParquet |
| `/avro`, `/excel`, `/lance`, `/orc` | Additional record and columnar formats |

Import metadata from `@loaders.gl/tables` or a bare format subpath such as `@loaders.gl/tables/csv`. Import parser-bearing loaders from named implementation subpaths such as `@loaders.gl/tables/csv-loader`. See [Packages](../../packages.md) for installation and loading patterns.

BSON document loaders and codecs live in [`@loaders.gl/documents`](/docs/modules/documents).
Parquet BSON logical columns use that codec automatically.
