---
title: RangeRequestScheduler
description: Coalesce nearby byte-range requests while preserving exact slices for callers.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Range-read scheduler"
  title="Turn many tiny reads into a bounded cloud request plan."
  description="`RangeRequestScheduler` batches nearby byte ranges, coalesces compatible requests, and returns each caller its exact requested slice. It is the transport layer beneath readers for formats such as PMTiles and other random-access objects."
  tone="blue"
  meta={['HTTP Range', 'Request coalescing', 'Transport diagnostics']}
  links={[
    {label: 'Loader utilities', to: '/docs/modules/loader-utils'},
    {label: 'Range cache', to: '/docs/modules/loader-utils/api-reference/range-request-cache'},
    {label: 'Scan architecture', to: '/docs/developer-guide/common-scan-architecture'}
  ]}
/>

<DocOrientation
  eyebrow="The scheduling path"
  title="Queue the logical reads. Merge compatible transport work."
  description="A format reader can ask for headers, indexes, or pages independently. The scheduler decides when to flush and how to over-fetch nearby bytes without changing the exact result each caller receives."
  tone="blue"
  items={[
    {label: 'Queue', value: 'Logical offset and length requests'},
    {label: 'Merge', value: 'Nearby compatible ranges within configured limits'},
    {label: 'Slice', value: 'Return each caller’s exact requested bytes'},
    {label: 'Observe', value: 'Track logical, merged, fetched, and failed ranges'}
  ]}
/>

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
  <img src="https://img.shields.io/badge/experimental-yellow.svg?style=flat-square" alt="experimental" />
</p>

`RangeRequestScheduler` is a low-level utility for coalescing nearby byte-range requests.
It can be composed with [`RangeRequestCache`](./range-request-cache) when completed ranges should
also be retained for reuse.
It is used by `PMTilesSourceLoader` and can be reused by other byte-range-addressable Sources.

<ReferenceBoundary
  title="Scheduling and transport details"
  description="The reference below covers batching, expansion, coalescing identity, custom transports, exact slicing, cancellation, and range statistics."
  tone="blue"
/>

```typescript
import {RangeRequestScheduler, createRangeStats, getRangeStats} from '@loaders.gl/loader-utils';

const stats = createRangeStats('pmtiles-range-transport');

const scheduler = new RangeRequestScheduler({
  batchDelayMs: 50,
  rangeExpansionBytes: 65536,
  maxMergedBytes: 8388608,
  stats
});

// Reuse one key only for requests with the same URL, credentials, and fetch behavior.
const transportContext = {};

const arrayBuffer = await scheduler.fetch({
  url,
  offset: 1_000_000,
  length: 4096,
  isolationKey: transportContext,
  fetchOptions: {
    headers: {Authorization: 'Bearer token'}
  }
});

const rangeStats = getRangeStats(stats);
```

## Constructor

### `new RangeRequestScheduler(props?)`

Creates a scheduler for one group of byte-range-addressable resources.

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `batchDelayMs` | `number` | `50` | Time to wait before flushing the queue. |
| `rangeExpansionBytes` | `number` | `65536` | Maximum gap to over-fetch between adjacent requests. |
| `maxGapBytes` | `number` | `65536` | Compatibility alias for `rangeExpansionBytes`. |
| `maxMergedBytes` | `number` | `8388608` | Maximum total byte length of one merged request. |
| `stats` | `Stats` | created per scheduler | Optional probe.gl `Stats` object that receives the range counters. |
| `onEvent` | `function` | none | Optional diagnostics callback for queued, batched, completed, failed, and aborted range requests. |

## Methods

### `fetch(request): Promise<ArrayBuffer>`

Enqueues one HTTP byte range and resolves to the exact requested byte slice. The scheduler
creates the `Range` header, preserves caller headers from `fetchOptions`, aborts ignored
`200 OK` full-object responses, handles `416` size probes for offset `0`, and records
transport diagnostics in `stats`.

HTTP fetch calls are isolated by default because separate calls may use different credentials,
headers, or fetch implementations. To coalesce compatible calls, pass the same stable
`isolationKey` object to each call. Keys are compared by identity (`===`), so creating a new object
for every request does not enable coalescing. Never reuse a key across different authentication or
validator contexts.

### `scheduleRequest(request): Promise<ArrayBuffer>`

Enqueues one exact range using a caller-supplied transport callback. The returned promise
resolves to the exact requested byte slice, not the merged transport response.

`request.fetchRange` must return the bytes for the offset and length it receives. Those may be
larger than the original request when several child requests are merged.
If a server legitimately clamps the final range at end of file, return a transport result with
`arrayBuffer` and the authoritative `sourceByteLength`. The scheduler accepts a short response only
when its end offset exactly matches that declared length; unmarked and mismatched short responses
are rejected.

`scheduleRequest()` coalesces requests with the same `sourceId` by default. Pass distinct
`isolationKey` values when one source identifier can refer to different transport, credential, or
validator contexts. Conversely, pass the same stable key to state explicitly that those contexts
are compatible.

Use `scheduleRequest` for non-HTTP transports or sources that need custom response handling.

### `flush(): void`

Starts the current queue immediately.

Applications usually do not call this directly. It is useful in tests or in a source that knows
no more sibling tile requests will arrive in the current frame.

## Stats Helpers

### `createRangeStats(id?): Stats`

Creates a probe.gl `Stats` object initialized with the counters used by
`RangeRequestScheduler`.

### `getRangeStats(stats): RangeStats`

Reads a typed snapshot from the probe.gl `Stats` object:

```typescript
type RangeStats = {
  logicalRanges: number;
  rangeBatches: number;
  transportRanges: number;
  completedTransportRanges: number;
  coalescedRanges: number;
  requestedBytes: number;
  transportBytes: number;
  responseBytes: number;
  networkTimeMs: number;
  overfetchBytes: number;
  failedTransportRanges: number;
  abortedLogicalRanges: number;
  fullResponseFallbacks: number;
};
```

Use `stats` when several helper classes need to contribute to the same diagnostic counters.
Use `onEvent` only when you need event-level logging or a UI refresh trigger.
