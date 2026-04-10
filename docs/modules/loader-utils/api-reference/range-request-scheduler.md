# RangeRequestScheduler

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
  <img src="https://img.shields.io/badge/experimental-yellow.svg?style=flat-square" alt="experimental" />
</p>

`RangeRequestScheduler` is a low-level utility for coalescing nearby byte-range requests.
It is used by `PMTilesSource` and can be reused by other byte-range-addressable Sources.

```typescript
import {RangeRequestScheduler, createRangeStats, getRangeStats} from '@loaders.gl/loader-utils';

const stats = createRangeStats('pmtiles-range-transport');

const scheduler = new RangeRequestScheduler({
  batchDelayMs: 50,
  rangeExpansionBytes: 65536,
  maxMergedBytes: 8388608,
  stats
});

const arrayBuffer = await scheduler.fetch({
  url,
  offset: 1_000_000,
  length: 4096,
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

### `scheduleRequest(request): Promise<ArrayBuffer>`

Enqueues one exact range using a caller-supplied transport callback. The returned promise
resolves to the exact requested byte slice, not the merged transport response.

`request.fetchRange` must return the bytes for the offset and length it receives. Those may be
larger than the original request when several child requests are merged.

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
  overfetchBytes: number;
  failedTransportRanges: number;
  abortedLogicalRanges: number;
  fullResponseFallbacks: number;
};
```

Use `stats` when several helper classes need to contribute to the same diagnostic counters.
Use `onEvent` only when you need event-level logging or a UI refresh trigger.
