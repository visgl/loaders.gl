# TileRangeRequestScheduler

`TileRangeRequestScheduler` is a low-level utility for coalescing nearby byte-range requests.
It is used by byte-range Sources such as PMTiles, GeoTIFF, COPC, and Potree.

```typescript
import {TileRangeRequestScheduler} from '@loaders.gl/loader-utils';

const scheduler = new TileRangeRequestScheduler({
  batchDelayMs: 50,
  rangeExpansionBytes: 65536,
  maxMergedBytes: 8388608
});

const arrayBuffer = await scheduler.scheduleRequest({
  sourceId: url,
  offset: 1_000_000,
  length: 4096,
  fetchRange: async (offset, length, signal) => {
    const response = await fetch(url, {
      signal,
      headers: {Range: `bytes=${offset}-${offset + length - 1}`}
    });
    return await response.arrayBuffer();
  }
});
```

## Constructor

### `new TileRangeRequestScheduler(props?)`

Creates a scheduler for one group of byte-range-addressable resources.

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `batchDelayMs` | `number` | `50` | Time to wait before flushing the queue. |
| `rangeExpansionBytes` | `number` | `65536` | Maximum gap to over-fetch between adjacent requests. |
| `maxGapBytes` | `number` | `65536` | Compatibility alias for `rangeExpansionBytes`. |
| `maxMergedBytes` | `number` | `8388608` | Maximum total byte length of one merged request. |

## Methods

### `scheduleRequest(request): Promise<ArrayBuffer>`

Enqueues one exact range. The returned promise resolves to the exact requested byte slice, not
the merged transport response.

`request.fetchRange` must return the bytes for the offset and length it receives. Those may be
larger than the original request when several child requests are merged.

### `flush(): void`

Starts the current queue immediately.

Applications usually do not call this directly. It is useful in tests or in a source that knows
no more sibling tile requests will arrive in the current frame.

