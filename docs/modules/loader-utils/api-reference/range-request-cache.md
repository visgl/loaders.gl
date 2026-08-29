---
title: RangeRequestCache
description: Cache immutable byte ranges and reuse contained reads in remote binary pipelines.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Range-read cache"
  title="Reuse the bytes a cloud-native reader already fetched."
  description="`RangeRequestCache` stores completed byte intervals, serves contained subranges, shares concurrent exact reads, and returns caller-owned buffers. It complements scheduling without hiding the source identity."
  tone="blue"
  meta={['Byte ranges', 'LRU budgets', 'Immutable caller buffers']}
  links={[
    {label: 'Loader utilities', to: '/docs/modules/loader-utils'},
    {label: 'Range scheduler', to: '/docs/modules/loader-utils/api-reference/range-request-scheduler'},
    {label: 'HTTP file', to: '/docs/modules/loader-utils/api-reference/http-file'}
  ]}
/>

<DocOrientation
  eyebrow="The range-cache path"
  title="Request once. Reuse contained bytes. Keep reads isolated by object version."
  description="Random-access formats often revisit headers, indexes, and nearby pages. The cache avoids duplicate transport while keeping cached storage safe from detached or mutated caller buffers."
  tone="blue"
  items={[
    {label: 'Key', value: 'Source identity plus byte offset and length'},
    {label: 'Reuse', value: 'Exact ranges and slices from containing ranges'},
    {label: 'Share', value: 'Concurrent identical reads'},
    {label: 'Bound', value: 'Entry and byte budgets with eviction events'}
  ]}
/>

- _Framework_: JavaScript
- _Module_: [`@loaders.gl/loader-utils`](https://www.npmjs.com/package/@loaders.gl/loader-utils)

`RangeRequestCache` is the byte-range counterpart to [`RequestCache`](./request-cache). It caches
exact byte ranges, serves contained subranges, shares concurrent exact loads, and returns a new
`ArrayBuffer` to every caller so cached storage cannot be detached or mutated accidentally.
Ranges larger than `maxBytes` bypass storage and are returned directly, avoiding a copy that would
be immediately evicted.

<ReferenceBoundary
  title="Cache behavior and identity details"
  description="The reference below covers range containment, concurrent loads, byte budgets, source versioning, eviction, and cancellation."
  tone="blue"
/>

```ts
import {RangeRequestCache, RangeRequestScheduler} from '@loaders.gl/loader-utils';

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

- `RangeRequestScheduler` batches and coalesces transport work.
- `RangeRequestCache` reuses completed bytes and deduplicates in-flight exact reads.

Use a versioned `sourceId`, such as URL plus ETag, when the remote object can change during the
cache lifetime.

## Constructor

### `new RangeRequestCache(props?)`

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `maxEntries` | `number` | `Infinity` | Maximum settled ranges retained. |
| `maxBytes` | `number` | `Infinity` | Maximum range bytes retained. |
| `onEvent` | `(event) => void` | | Receives hit, miss, store, and eviction events. |

## Methods

### `read(request)`

Returns an exact cached range, a slice of a containing range, or loads one exact range through
`fetchRange`.

### `get(sourceId, offset, length, signal?)`

Returns an exact or contained cached range without starting a request.

### `set(sourceId, offset, arrayBuffer)`

Seeds cache-owned bytes. The input is copied.

### `deleteSource(sourceId)`

Removes all ranges for one source or object version.

### `clear()`

Removes retained bytes and aborts pending requests.
