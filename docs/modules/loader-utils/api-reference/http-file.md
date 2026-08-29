---
title: HttpFile
description: Read remote objects through validated random-access HTTP range requests.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Remote random access"
  title="Read a cloud object like a local binary file."
  description="`HttpFile` pins the remote object’s length and validators, then exposes exact reads through the `ReadableFile` interface. It makes range-addressable formats usable without downloading the whole object first."
  tone="blue"
  meta={['HTTP Range', 'ETag consistency', 'Browser and Node.js']}
  links={[
    {label: 'Loader utilities', to: '/docs/modules/loader-utils'},
    {label: 'Range scheduler', to: '/docs/modules/loader-utils/api-reference/range-request-scheduler'},
    {label: 'Readable files', to: '/docs/modules/loader-utils/api-reference/readable-file'}
  ]}
/>

<DocOrientation
  eyebrow="The remote-file path"
  title="Pin the object. Request a range. Validate the response."
  description="Cloud-native readers depend on exact byte ranges, but remote objects can change or servers can return unexpected responses. `HttpFile` keeps identity and transport validation together."
  tone="blue"
  items={[
    {label: 'Open', value: 'Discover length and available validators'},
    {label: 'Read', value: 'Issue exact `Range` requests for byte intervals'},
    {label: 'Validate', value: 'Check status, Content-Range, length, and identity'},
    {label: 'Return', value: 'ArrayBuffer through the common ReadableFile contract'}
  ]}
/>

<p className="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
  <img src="https://img.shields.io/badge/experimental-yellow.svg?style=flat-square" alt="experimental" />
</p>

`HttpFile` provides validated random access to a remote object in browsers and Node.js. It sends
exact HTTP range requests, pins the object's length and available validators, and rejects responses
that no longer describe the same object.

<ReferenceBoundary
  title="Remote file and consistency details"
  description="The reference below covers opening, range reads, headers, validators, consistency modes, scheduling, telemetry, and failure behavior."
  tone="blue"
/>

```typescript
import {HttpFile} from '@loaders.gl/loader-utils';

const file = await HttpFile.open('https://example.com/data.parquet', {
  consistency: 'strict'
});

const footer = await file.read(file.size - 8, 8);
console.log(new Uint8Array(footer), file.getTelemetry());
await file.close();
```

The server must support byte ranges. A normal request must return `206 Partial Content` with an
exact `Content-Range`; `HttpFile` deliberately rejects a `200 OK` full-object fallback. A valid
zero-byte object may respond to the opening probe with `416 Range Not Satisfiable` and
`Content-Range: bytes */0`.

## Opening a file

### `HttpFile.open(url, options?, signal?): Promise<HttpFile>`

Creates a file and immediately pins its identity. Unless a complete identity is supplied, opening
sends `Range: bytes=0-0` to discover the object length, `ETag`, and `Last-Modified` value.

Supplying a known length together with either validator avoids that opening request:

```typescript
const file = await HttpFile.open(url, {
  byteLength: manifest.byteLength,
  etag: manifest.etag,
  consistency: 'strict'
});
```

### `new HttpFile(url, options?)`

Creates a lazy file. The first call to `open()`, `stat()`, or `read()` discovers and pins the
identity. Concurrent callers share one discovery request, while each caller can independently
cancel its own wait.

Prefer the static `HttpFile.open()` form when code needs to use `size` synchronously.

## Options

| Option | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `fetch` | `(url, init?) => Promise<Response>` | `globalThis.fetch` | Custom fetch implementation. |
| `fetchOptions` | `RequestInit` | none | Headers, credentials, and other options copied to every request. `HttpFile` supplies the `GET` method, `Range` header, and combined signal. |
| `byteLength` | `number` | discovered | Trusted non-negative object length. |
| `etag` | `string` | discovered | Trusted object ETag. |
| `lastModified` | `string` | discovered | Trusted Last-Modified value. |
| `consistency` | `'best-effort' \| 'strict'` | `'best-effort'` | Controls how missing validators are handled. Changed visible validators are always rejected. |
| `rangeScheduler` | `RangeRequestScheduler` | private scheduler | Shared scheduler used to coalesce compatible reads. Each `HttpFile` remains an isolated request context. |
| `rangeSchedulerProps` | `RangeRequestSchedulerProps` | `{batchDelayMs: 0}` | Configuration for the private scheduler. Ignored when `rangeScheduler` is supplied. |

`fetchOptions.headers` are preserved except for `Range`, which is set for each read. A signal in
`fetchOptions` applies to every request; a signal passed to `open()` or `read()` applies only to that
operation.

## Consistency modes

### `best-effort`

Rejects changed validators whenever the server exposes them. It permits a response that omits a
previously visible validator, which is useful when a server or CORS policy does not expose headers
consistently. If an ETag disappears but both responses expose `Last-Modified`, that fallback must
still match.

### `strict`

Requires every response to expose the pinned validator. If no validator was supplied, the opening
response must expose either `ETag` or `Last-Modified`.

For cross-origin URLs, expose `Content-Range`, `ETag`, and `Last-Modified` through the server's CORS
configuration when strict validation is required.

## Properties

### `size: number`

Pinned object length. A lazy file reports a supplied `byteLength`, or zero until identity discovery
has completed.

### `bigsize: bigint`

The same object length represented as a bigint.

### `url: string`

Remote object URL. `handle` contains the same value for the `ReadableFile` interface.

## Methods

### `open(signal?): Promise<this>`

Pins the identity of a lazily constructed file. Repeated calls reuse the cached identity.

### `read(offset?, length?, signal?): Promise<ArrayBuffer>`

Reads exactly `length` bytes starting at `offset`. Both values must be non-negative safe integers,
and the range must not extend past `size`. A zero-length read returns an empty buffer without an
HTTP request after identity is known.

Each non-empty response is accepted only when all of the following are true:

- the status is `206`;
- `Content-Range` exactly matches the requested offsets and pinned object length;
- visible validators are consistent with the pinned identity; and
- the consumed response body contains exactly the requested number of bytes.

### `stat(): Promise<Stat>`

Returns the pinned `size`, `bigsize`, and `isDirectory: false`. It discovers identity first when the
file is lazy.

### `getIdentitySnapshot(): HttpFileIdentity | null`

Returns the frozen pinned `{byteLength, etag, lastModified}` object, or `null` before a lazy file has
opened.

### `getTelemetry(): HttpFileTelemetry`

Returns a frozen point-in-time snapshot:

```typescript
type HttpFileTelemetry = {
  requestedBytes: number;
  downloadedBytes: number;
  requestCount: number;
  networkTimeMs: number;
  abortCount: number;
  errorCount: number;
};
```

The counters belong to this `HttpFile`, even when its scheduler is shared with other files.

### `fetchRange(offset, length, signal?): Promise<Response>`

Compatibility method for `ReadableFile` consumers that expect a `Response`. New code should prefer
`read()`.

### `close(): Promise<void>`

Prevents new operations. Active requests remain controlled by their per-operation or persistent
abort signals.

## Sharing a range scheduler

Several files may share a [`RangeRequestScheduler`](./range-request-scheduler) to centralize queue
configuration and stats. `HttpFile` assigns every instance a private isolation key, so requests
with different credentials, validators, or fetch implementations are never coalesced together.
