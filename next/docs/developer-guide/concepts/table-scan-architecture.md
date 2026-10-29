Portable table execution

# Describe the result once. Let the source optimize it.

The table scan contract gives readers and planners a common seam: metadata explains what can be pushed down, and scan returns ordered batches without exposing each format’s physical layout.

[Common scan architecture](https://loaders.gl/next/docs/developer-guide/common-scan-architecture.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/common-scan-architecture.md)[Apache Arrow](https://loaders.gl/next/docs/developer-guide/apache-arrow.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/apache-arrow.md)

The small contract

## Same query vocabulary. Different physical plans.

A CSV source may scan linearly, while Parquet prunes row groups and a backend compiles the same request to SQL. Callers still work with metadata, cancellation, and async table batches.

01

Query

Predicate, columns, limit, and signal

02

Plan

Metadata reports pushdown and residual work

03

Execute

The source chooses ranges, rows, or pages

04

Return

Ordered Arrow-compatible batches

The table scan contract is the common seam between a format reader and a query planner. A source implements `TableScanSource`, reports its schema and capabilities through `getQueryMetadata()`, and returns ordered batches from `scan(options)`. The options object is immutable and deliberately small: `predicate`, `columns`, `limit`, and `signal`.

Detailed guide

## Sources, plans, and execution

The sections below describe linear sources, format-specific optimization, backpressure, cancellation, and the common scan invariants.

## Linear sources[​](#linear-sources "Direct link to Linear sources")

CSV, NDJSON, and Arrow IPC are forward-only formats. Their source adapters preserve the parser's batch boundaries and apply a global `limit` without collecting the entire result. They advertise unsupported operations explicitly, so a planner can choose a different backend or reject a query before reading bytes. Indexed and columnar formats can later override the same contract with predicate and projection pushdown.

## Format-specific optimization[​](#format-specific-optimization "Direct link to Format-specific optimization")

The contract does not require every source to implement every optimization. A Parquet source may prune row groups, while a CSV source must inspect rows sequentially. Both remain interchangeable to callers because metadata describes the capabilities and output is always an async sequence of table batches.

## Backpressure and cancellation[​](#backpressure-and-cancellation "Direct link to Backpressure and cancellation")

`scan()` is lazy. Consumers control demand by awaiting the next batch, and an `AbortSignal` is forwarded to source fetches. Future adapters should use the same behavior for range requests, workers, and GPU execution.
