# Apache Iceberg

| Type    | API                                                                                                                    | Support                                        |
| ------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| Source  | [`IcebergTableSource`](https://loaders.gl/next/docs/modules/tables/parquet/api-reference/iceberg-table-source.md) | Read Iceberg metadata and data files.          |
| Utility | [`IcebergRestCatalog`](https://loaders.gl/next/docs/modules/tables/parquet/api-reference/iceberg-table-source.md) | Access tables through an Iceberg REST catalog. |

[Apache Iceberg](https://iceberg.apache.org/) is an open table format that tracks snapshots and data files through table metadata.

## loaders.gl support[​](#loadersgl-support "Direct link to loaders.gl support")

Read Iceberg tables using `IcebergTableSource` from `@loaders.gl/tables/iceberg`. See the [IcebergTableSource reference](https://loaders.gl/next/docs/modules/tables/parquet/api-reference/iceberg-table-source.md) for supported metadata, catalog integration, and scan options.
