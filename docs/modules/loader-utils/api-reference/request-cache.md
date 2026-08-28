# RequestCache

- _Framework_: JavaScript
- _Module_: [`@loaders.gl/loader-utils`](https://www.npmjs.com/package/@loaders.gl/loader-utils)

`RequestCache` is a source-scoped, bounded LRU cache for asynchronous request results. It shares
concurrent requests, retains settled results by recency, and can enforce both entry-count and byte
budgets.

```ts
import {RequestCache} from '@loaders.gl/loader-utils';

const cache = new RequestCache<ArrayBuffer>({
  maxEntries: 32,
  maxBytes: 8 * 1024 * 1024,
  getByteLength: value => value.byteLength
});

const data = await cache.getOrLoad('subtree.json', signal => fetch(url, {signal}).then(r => r.arrayBuffer()));
```

Pending requests are not evicted. Each caller can supply its own abort signal; one caller aborting
does not cancel a request still needed by another caller. The cache aborts the underlying request
when every waiter has aborted or when the cache is cleared.

## Constructor

### `new RequestCache(props?)`

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `maxEntries` | `number` | `Infinity` | Maximum settled entries retained. |
| `maxBytes` | `number` | `Infinity` | Maximum estimated bytes retained. |
| `getByteLength` | `(value) => number` | `() => 0` | Estimates one settled value's retained bytes. |
| `onRemove` | `(key, reason) => void` | | Receives deletion, eviction, abort, error, replacement, and clear events. |

## Methods

### `get(key, signal?)`

Returns the cached promise and updates its LRU position, or `undefined` on a miss.

### `getOrLoad(key, load, signal?)`

Returns an existing request or starts one shared request. Failed and fully aborted requests are
removed so a later call can retry.

### `set(key, value)`

Stores an already available value.

### `delete(key)`

Removes one entry and aborts it when it is still pending.

### `clear()`

Removes all entries and aborts all pending requests.

## Cache roles

`RequestCache` owns generic request-result reuse. Tile content caches remain specialized because
they protect visible tiles and coordinate GPU/resource unloading. `RangeRequestCache` adds byte
interval containment and immutable slices for random-access formats.
