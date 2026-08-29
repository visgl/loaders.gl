---
title: RequestCache
description: Share concurrent requests and retain settled results within source-scoped entry and byte budgets.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Loader utilities / request cache"
  title="Deduplicate work, then keep useful results nearby."
  description="RequestCache shares in-flight requests, retains settled values by recency, and bounds storage by entries or estimated bytes. It is designed for one source's request lifecycle rather than as a global HTTP cache."
  tone="yellow"
  meta={['Concurrent request sharing', 'Entry and byte budgets', 'Abort-aware']}
  links={[
    {label: 'Loader utilities', to: '/docs/modules/loader-utils'},
    {label: '3D Tiles cache', to: '/docs/modules/3d-tiles/concepts/caching-and-memory'},
    {label: 'Request scheduling', to: '/docs/modules/loader-utils/api-reference/request-scheduler'}
  ]}
/>

<DocOrientation
  eyebrow="Source-scoped cache"
  title="Share pending work without making cancellation surprising."
  description="Several consumers can ask for the same resource and share one promise. A caller may abort its own wait, while the underlying request remains alive for other waiters until the cache no longer needs it."
  tone="yellow"
  items={[
    {label: 'Share', value: 'Deduplicate concurrent loads for the same key.'},
    {label: 'Retain', value: 'Keep settled results by recency for nearby reuse.'},
    {label: 'Bound', value: 'Limit entries and estimated retained bytes.'},
    {label: 'Cancel', value: 'Abort underlying work only when no waiter still needs it.'}
  ]}
/>

<ReferenceBoundary
  title="RequestCache reference"
  description="The detailed reference covers construction, loading, eviction, byte estimation, abort behavior, clear operations, and lifecycle events."
  tone="yellow"
/>

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
