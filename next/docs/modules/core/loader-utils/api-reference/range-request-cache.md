Range-read cache

# Reuse the bytes a cloud-native reader already fetched.

`RangeRequestCache` stores completed byte intervals, serves contained subranges, shares concurrent exact reads, and returns caller-owned buffers. It complements scheduling without hiding the source identity.

[Loader utilities](https://loaders.gl/next/docs/modules/core/loader-utils.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core/loader-utils.md)[Range scheduler](https://loaders.gl/next/docs/modules/core/loader-utils/api-reference/range-request-scheduler.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core/loader-utils/api-reference/range-request-scheduler.md)[HTTP file](https://loaders.gl/next/docs/modules/core/loader-utils/api-reference/http-file.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core/loader-utils/api-reference/http-file.md)

The range-cache path

## Request once. Reuse contained bytes. Keep reads isolated by object version.

Random-access formats often revisit headers, indexes, and nearby pages. The cache avoids duplicate transport while keeping cached storage safe from detached or mutated caller buffers.

01

Key

Source identity plus byte offset and length

02

Reuse

Exact ranges and slices from containing ranges

03

Share

Concurrent identical reads

04

Bound

Entry and byte budgets with eviction events

* *Framework*: JavaScript
* *Module*: [`@loaders.gl/core/loader-utils`](https://www.npmjs.com/package/@loaders.gl/core/loader-utils)

`RangeRequestCache` is the byte-range counterpart to [`RequestCache`](https://loaders.gl/next/docs/modules/core/loader-utils/api-reference/request-cache.md). It caches exact byte ranges, serves contained subranges, shares concurrent exact loads, and returns a new `ArrayBuffer` to every caller so cached storage cannot be detached or mutated accidentally. Ranges larger than `maxBytes` bypass storage and are returned directly, avoiding a copy that would be immediately evicted.

Detailed guide

## Cache behavior and identity details

The reference below covers range containment, concurrent loads, byte budgets, source versioning, eviction, and cancellation.

```
import {RangeRequestCache, RangeRequestScheduler} from '@loaders.gl/core/loader-utils';



const scheduler = new RangeRequestScheduler({batchDelayMs: 0});

const cache = new RangeRequestCache({maxBytes: 8 * 1024 * 1024});



const bytes = await cache.read({

  sourceId: `${url}#${etag}`,

  offset,

  length,

  signal,

  fetchRange: (rangeOffset, rangeLength, rangeSignal) =>

    scheduler.fetch({

      url,

      sourceId: `${url}#${etag}`,

      offset: rangeOffset,

      length: rangeLength,

      signal: rangeSignal

    })

});
```

The cache and scheduler have separate responsibilities:

* `RangeRequestScheduler` batches and coalesces transport work.
* `RangeRequestCache` reuses completed bytes and deduplicates in-flight exact reads.

Use a versioned `sourceId`, such as URL plus ETag, when the remote object can change during the cache lifetime.

## Constructor[​](#constructor "Direct link to Constructor")

### `new RangeRequestCache(props?)`[​](#new-rangerequestcacheprops "Direct link to new-rangerequestcacheprops")

| Property     | Type              | Default    | Description                                     |
| ------------ | ----------------- | ---------- | ----------------------------------------------- |
| `maxEntries` | `number`          | `Infinity` | Maximum settled ranges retained.                |
| `maxBytes`   | `number`          | `Infinity` | Maximum range bytes retained.                   |
| `onEvent`    | `(event) => void` |            | Receives hit, miss, store, and eviction events. |

## Methods[​](#methods "Direct link to Methods")

### `read(request)`[​](#readrequest "Direct link to readrequest")

Returns an exact cached range, a slice of a containing range, or loads one exact range through `fetchRange`.

### `get(sourceId, offset, length, signal?)`[​](#getsourceid-offset-length-signal "Direct link to getsourceid-offset-length-signal")

Returns an exact or contained cached range without starting a request.

### `set(sourceId, offset, arrayBuffer)`[​](#setsourceid-offset-arraybuffer "Direct link to setsourceid-offset-arraybuffer")

Seeds cache-owned bytes. The input is copied.

### `deleteSource(sourceId)`[​](#deletesourcesourceid "Direct link to deletesourcesourceid")

Removes all ranges for one source or object version.

### `clear()`[​](#clear "Direct link to clear")

Removes retained bytes and aborts pending requests.
