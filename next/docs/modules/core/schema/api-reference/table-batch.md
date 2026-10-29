Schema module · batch API

# TableBatch

A table batch is a bounded unit of records emitted by streaming loaders and scans. It keeps progressive processing compatible with both row-oriented and Arrow-backed data.

[Schema module](https://loaders.gl/next/docs/modules/core/schema.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core/schema.md)[Parse in batches](https://loaders.gl/next/docs/modules/core/api-reference/parse-in-batches.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core/api-reference/parse-in-batches.md)[Apache Arrow](https://loaders.gl/next/docs/developer-guide/apache-arrow.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/apache-arrow.md)

The batch boundary

## Process data while the rest is still arriving.

Batches provide a stable unit for incremental parsing, worker transfer, filtering, and rendering. The batch shape tells consumers how to interpret its payload.

01

Rows

RowTableBatch for object or array records

02

Columns

ColumnarTableBatch for column data

03

Arrow

ArrowTableBatch for record batches

04

Progress

Optional byte and record progress metadata

Detailed guide

## TableBatch reference

The sections below list the supported batch families and their relationship to Arrow record batches.

* RowTableBatch
* ColumnarTableBatch
* ArrowTableBatch
