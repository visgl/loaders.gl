# Table scan architecture

The table scan contract is the common seam between a format reader and a query planner. A source
implements `TableScanSource`, reports its schema and capabilities through `getQueryMetadata()`, and
returns ordered batches from `scan(options)`. The options object is immutable and deliberately small:
`predicate`, `columns`, `limit`, and `signal`.

## Linear sources

CSV, NDJSON, and Arrow IPC are forward-only formats. Their source adapters preserve the parser's
batch boundaries and apply a global `limit` without collecting the entire result. They advertise
unsupported operations explicitly, so a planner can choose a different backend or reject a query
before reading bytes. Indexed and columnar formats can later override the same contract with
predicate and projection pushdown.

## Format-specific optimization

The contract does not require every source to implement every optimization. A Parquet source may
prune row groups, while a CSV source must inspect rows sequentially. Both remain interchangeable to
callers because metadata describes the capabilities and output is always an async sequence of table
batches.

## Backpressure and cancellation

`scan()` is lazy. Consumers control demand by awaiting the next batch, and an `AbortSignal` is
forwarded to source fetches. Future adapters should use the same behavior for range requests,
workers, and GPU execution.
