# Apache Hudi

| Type | API | Support |
| --- | --- | --- |
| Source | `HudiTableSource` | Read a Copy-on-Write snapshot descriptor and its Parquet base files. |

[Apache Hudi](https://hudi.apache.org/) is an open table format for managing data lakes.

## loaders.gl support

`HudiTableSource` from `@loaders.gl/tables/hudi` provides a read-only Copy-on-Write proof of concept. It accepts a JSON snapshot descriptor listing Parquet base files. Merge-on-Read logs, incremental timeline queries, deletes, and compaction are not supported. See the [Parquet module overview](../parquet/README.md) for the underlying reader.
