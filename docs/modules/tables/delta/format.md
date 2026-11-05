# Delta Lake

| Type | API | Support |
| --- | --- | --- |
| Source | [`DeltaTableSource`](../parquet/api-reference/delta-table-source.md) | Read a Delta Lake snapshot and its Parquet data files. |

[Delta Lake](https://delta.io/) is an open table format that uses a transaction log to track table snapshots.

## loaders.gl support

Read Delta tables using `DeltaTableSource` from `@loaders.gl/tables/delta`. The source resolves a selected transaction-log snapshot and reads its Parquet data files. See the [DeltaTableSource reference](../parquet/api-reference/delta-table-source.md) for supported operations and options.
