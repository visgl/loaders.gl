Range-read scheduler

# Turn many tiny reads into a bounded cloud request plan.

`RangeRequestScheduler` batches nearby byte ranges, coalesces compatible requests, and returns each caller its exact requested slice. It is the transport layer beneath readers for formats such as PMTiles and other random-access objects.

[Loader utilities](https://loaders.gl/next/docs/modules/core/loader-utils.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core/loader-utils.md)[Range cache](https://loaders.gl/next/docs/modules/core/loader-utils/api-reference/range-request-cache.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core/loader-utils/api-reference/range-request-cache.md)[Scan architecture](https://loaders.gl/next/docs/developer-guide/common-scan-architecture.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/common-scan-architecture.md)

The scheduling path

## Queue the logical reads. Merge compatible transport work.

A format reader can ask for headers, indexes, or pages independently. The scheduler decides when to flush and how to over-fetch nearby bytes without changing the exact result each caller receives.

01

Queue

Logical offset and length requests

02

Merge

Nearby compatible ranges within configured limits

03

Slice

Return each caller’s exact requested bytes

04

Observe

Track logical, merged, fetched, and failed ranges

![From-v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)![experimental](https://img.shields.io/badge/experimental-yellow.svg?style=flat-square)

`RangeRequestScheduler` is a low-level utility for coalescing nearby byte-range requests. It can be composed with [`RangeRequestCache`](https://loaders.gl/next/docs/modules/core/loader-utils/api-reference/range-request-cache.md) when completed ranges should also be retained for reuse. It is used by `PMTilesSourceLoader` and can be reused by other byte-range-addressable Sources.

Detailed guide

## Scheduling and transport details

The reference below covers batching, expansion, coalescing identity, custom transports, exact slicing, cancellation, and range statistics.

```
import {RangeRequestScheduler, createRangeStats, getRangeStats} from '@loaders.gl/core/loader-utils';



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

## Constructor[​](#constructor "Direct link to Constructor")

### `new RangeRequestScheduler(props?)`[​](#new-rangerequestschedulerprops "Direct link to new-rangerequestschedulerprops")

Creates a scheduler for one group of byte-range-addressable resources.

| Prop                  | Type       | Default                   | Description                                                                                       |
| --------------------- | ---------- | ------------------------- | ------------------------------------------------------------------------------------------------- |
| `batchDelayMs`        | `number`   | `50`                      | Fixed wait from the first queued range before flushing the batch.                                 |
| `rangeExpansionBytes` | `number`   | `65536`                   | Maximum gap to over-fetch between adjacent requests.                                              |
| `maxGapBytes`         | `number`   | `65536`                   | Compatibility alias for `rangeExpansionBytes`.                                                    |
| `maxMergedBytes`      | `number`   | `8388608`                 | Maximum total byte length of one merged request.                                                  |
| `maxTotalBytes`       | `number`   | `Number.MAX_SAFE_INTEGER` | Lifetime budget for started merged transport spans, including coalesced gaps.                     |
| `stats`               | `Stats`    | created per scheduler     | Optional probe.gl `Stats` object that receives the range counters.                                |
| `onEvent`             | `function` | none                      | Optional diagnostics callback for queued, batched, completed, failed, and aborted range requests. |

The total-byte budget is reserved synchronously before each transport starts, across all sources and concurrent requests on the scheduler. Cache hits handled before scheduling consume no budget. Failed reads and reads canceled after starting retain their reservation. A range rejected by the budget never calls its transport; end-of-file clamping may return fewer bytes than reserved. Limits must be positive safe integers. Use a new scheduler for a fresh budget. This bounds planned range bytes; custom transports remain responsible for bounding actual response bodies.

The first queued range starts the batching window. Later arrivals join the batch without extending that window, and completed transports do not change it. Each flush starts all merged requests; later batches can start while earlier transports remain in flight.

This differs from [RequestScheduler](https://loaders.gl/next/docs/modules/core/loader-utils/api-reference/request-scheduler.md), which limits concurrency and restarts its `debounceTime` window when new requests arrive.

## Methods[​](#methods "Direct link to Methods")

### `fetch(request): Promise<ArrayBuffer>`[​](#fetchrequest-promisearraybuffer "Direct link to fetchrequest-promisearraybuffer")

Enqueues one HTTP byte range and resolves to the exact requested byte slice. The scheduler creates the `Range` header, preserves caller headers from `fetchOptions`, aborts ignored `200 OK` full-object responses, handles `416` size probes for offset `0`, and records transport diagnostics in `stats`.

HTTP fetch calls are isolated by default because separate calls may use different credentials, headers, or fetch implementations. To coalesce compatible calls, pass the same stable `isolationKey` object to each call. Keys are compared by identity (`===`), so creating a new object for every request does not enable coalescing. Never reuse a key across different authentication or validator contexts.

### `scheduleRequest(request): Promise<ArrayBuffer>`[​](#schedulerequestrequest-promisearraybuffer "Direct link to schedulerequestrequest-promisearraybuffer")

Enqueues one exact range using a caller-supplied transport callback. The returned promise resolves to the exact requested byte slice, not the merged transport response.

`request.fetchRange` must return the bytes for the offset and length it receives. Those may be larger than the original request when several child requests are merged. If a server legitimately clamps the final range at end of file, return a transport result with `arrayBuffer` and the authoritative `sourceByteLength`. The scheduler accepts a short response only when its end offset exactly matches that declared length; unmarked and mismatched short responses are rejected.

`scheduleRequest()` coalesces requests with the same `sourceId` by default. Pass distinct `isolationKey` values when one source identifier can refer to different transport, credential, or validator contexts. Conversely, pass the same stable key to state explicitly that those contexts are compatible.

Use `scheduleRequest` for non-HTTP transports or sources that need custom response handling.

### `flush(): void`[​](#flush-void "Direct link to flush-void")

Starts the current queue immediately.

Applications usually do not call this directly. It is useful in tests or in a source that knows no more sibling tile requests will arrive in the current frame.

## Stats Helpers[​](#stats-helpers "Direct link to Stats Helpers")

### `createRangeStats(id?): Stats`[​](#createrangestatsid-stats "Direct link to createrangestatsid-stats")

Creates a probe.gl `Stats` object initialized with the counters used by `RangeRequestScheduler`.

### `getRangeStats(stats): RangeStats`[​](#getrangestatsstats-rangestats "Direct link to getrangestatsstats-rangestats")

Reads a typed snapshot from the probe.gl `Stats` object:

```
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

Use `stats` when several helper classes need to contribute to the same diagnostic counters. Use `onEvent` only when you need event-level logging or a UI refresh trigger.

The scheduler bounds physical transport concurrency (`maxConcurrency`, default 6), outstanding logical requests (`maxQueueSize`, default 4096), and each transport range (`maxRangeBytes`, default 64 MiB). Limits must be positive safe integers. Oversized requests and queue overflow reject before transport; coalescing never grows a range past the limit. Canceling a queued subscriber releases its queue entry. A shared transport is aborted only when its final active subscriber cancels. A transport that ignores AbortSignal retains its physical concurrency slot until it settles.

`finalize()` cancels owned work, releases queued groups, and rejects subsequent requests. A source using an injected scheduler must preserve that borrowed scheduler. Abort reasons are preserved when the runtime supports `AbortSignal.reason`.
