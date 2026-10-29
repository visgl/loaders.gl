# @loaders.gl/tables

Table and record formats share one package, with format-specific metadata and parser entrypoints.

| Subpath                                                                | Formats                                      |
| ---------------------------------------------------------------------- | -------------------------------------------- |
| [arrow](https://loaders.gl/next/docs/modules/tables/arrow.md)     | Apache Arrow and GeoArrow                    |
| [csv](https://loaders.gl/next/docs/modules/tables/csv.md)         | CSV                                          |
| [json](https://loaders.gl/next/docs/modules/tables/json.md)       | JSON, GeoJSON and newline-delimited variants |
| [parquet](https://loaders.gl/next/docs/modules/tables/parquet.md) | Parquet and GeoParquet                       |
| `/avro`, `/bson`, `/excel`, `/lance`, `/orc`                           | Additional record and columnar formats       |

Import metadata from `@loaders.gl/tables` or a bare format subpath such as `@loaders.gl/tables/csv`. Import parser-bearing loaders from named implementation subpaths such as `@loaders.gl/tables/csv/csv-loader`. See [Packages](https://loaders.gl/next/docs/packages.md) for installation and loading patterns.
