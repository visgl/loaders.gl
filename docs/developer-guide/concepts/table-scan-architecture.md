---
title: Table scan architecture
description: Use one small query contract across in-memory tables, files, cloud datasets, and backend services.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Portable table execution"
  title="Describe the result once. Let the source optimize it."
  description="The table scan contract gives readers and planners a common seam: metadata explains what can be pushed down, and scan returns ordered batches without exposing each format’s physical layout."
  tone="mint"
  meta={['Query contract', 'Capability metadata', 'Ordered batches']}
  links={[
    {label: 'Common scan architecture', to: '/docs/developer-guide/common-scan-architecture'},
    {label: 'Apache Arrow', to: '/docs/developer-guide/apache-arrow'}
  ]}
/>

<DocOrientation
  eyebrow="The small contract"
  title="Same query vocabulary. Different physical plans."
  description="A CSV source may scan linearly, while Parquet prunes row groups and a backend compiles the same request to SQL. Callers still work with metadata, cancellation, and async table batches."
  tone="mint"
  items={[
    {label: 'Query', value: 'Predicate, columns, limit, and signal'},
    {label: 'Plan', value: 'Metadata reports pushdown and residual work'},
    {label: 'Execute', value: 'The source chooses ranges, rows, or pages'},
    {label: 'Return', value: 'Ordered Arrow-compatible batches'}
  ]}
/>

The table scan contract is the common seam between a format reader and a query planner. A source
implements `TableScanSource`, reports its schema and capabilities through `getQueryMetadata()`, and
returns ordered batches from `scan(options)`. The options object is immutable and deliberately small:
`predicate`, `columns`, `limit`, and `signal`.

<ReferenceBoundary
  title="Sources, plans, and execution"
  description="The sections below describe linear sources, format-specific optimization, backpressure, cancellation, and the common scan invariants."
  tone="mint"
/>

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
