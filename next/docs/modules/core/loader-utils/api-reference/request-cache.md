Loader utilities / request cache

# Deduplicate work, then keep useful results nearby.

RequestCache shares in-flight requests, retains settled values by recency, and bounds storage by entries or estimated bytes. It is designed for one source's request lifecycle rather than as a global HTTP cache.

[Loader utilities](https://loaders.gl/next/docs/modules/core/loader-utils.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core/loader-utils.md)[3D Tiles cache](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts/caching-and-memory.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/concepts/caching-and-memory.md)[Request scheduling](https://loaders.gl/next/docs/modules/core/loader-utils/api-reference/request-scheduler.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core/loader-utils/api-reference/request-scheduler.md)

Source-scoped cache

## Share pending work without making cancellation surprising.

Several consumers can ask for the same resource and share one promise. A caller may abort its own wait, while the underlying request remains alive for other waiters until the cache no longer needs it.

01

Share

Deduplicate concurrent loads for the same key.

02

Retain

Keep settled results by recency for nearby reuse.

03

Bound

Limit entries and estimated retained bytes.

04

Cancel

Abort underlying work only when no waiter still needs it.

Detailed guide

## RequestCache reference

The detailed reference covers construction, loading, eviction, byte estimation, abort behavior, clear operations, and lifecycle events.

* *Framework*: JavaScript
* *Module*: [`@loaders.gl/core/loader-utils`](https://www.npmjs.com/package/@loaders.gl/core/loader-utils)

`RequestCache` is a source-scoped, bounded LRU cache for asynchronous request results. It shares concurrent requests, retains settled results by recency, and can enforce both entry-count and byte budgets.

```
import {RequestCache} from '@loaders.gl/core/loader-utils';



const cache = new RequestCache<ArrayBuffer>({

  maxEntries: 32,

  maxBytes: 8 * 1024 * 1024,

  getByteLength: value => value.byteLength

});



const data = await cache.getOrLoad('subtree.json', signal => fetch(url, {signal}).then(r => r.arrayBuffer()));
```

Pending requests are not evicted. Each caller can supply its own abort signal; one caller aborting does not cancel a request still needed by another caller. The cache aborts the underlying request when every waiter has aborted or when the cache is cleared.

## Constructor[​](#constructor "Direct link to Constructor")

### `new RequestCache(props?)`[​](#new-requestcacheprops "Direct link to new-requestcacheprops")

| Property        | Type                    | Default    | Description                                                               |
| --------------- | ----------------------- | ---------- | ------------------------------------------------------------------------- |
| `maxEntries`    | `number`                | `Infinity` | Maximum settled entries retained.                                         |
| `maxBytes`      | `number`                | `Infinity` | Maximum estimated bytes retained.                                         |
| `getByteLength` | `(value) => number`     | `() => 0`  | Estimates one settled value's retained bytes.                             |
| `onRemove`      | `(key, reason) => void` |            | Receives deletion, eviction, abort, error, replacement, and clear events. |

## Methods[​](#methods "Direct link to Methods")

### `get(key, signal?)`[​](#getkey-signal "Direct link to getkey-signal")

Returns the cached promise and updates its LRU position, or `undefined` on a miss.

### `getOrLoad(key, load, signal?)`[​](#getorloadkey-load-signal "Direct link to getorloadkey-load-signal")

Returns an existing request or starts one shared request. Failed and fully aborted requests are removed so a later call can retry.

### `set(key, value)`[​](#setkey-value "Direct link to setkey-value")

Stores an already available value.

### `delete(key)`[​](#deletekey "Direct link to deletekey")

Removes one entry and aborts it when it is still pending.

### `clear()`[​](#clear "Direct link to clear")

Removes all entries and aborts all pending requests.

## Cache roles[​](#cache-roles "Direct link to Cache roles")

`RequestCache` owns generic request-result reuse. Tile content caches remain specialized because they protect visible tiles and coordinate GPU/resource unloading. `RangeRequestCache` adds byte interval containment and immutable slices for random-access formats.
