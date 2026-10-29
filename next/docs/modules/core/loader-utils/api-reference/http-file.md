Remote random access

# Read a cloud object like a local binary file.

`HttpFile` pins the remote object’s length and validators, then exposes exact reads through the `ReadableFile` interface. It makes range-addressable formats usable without downloading the whole object first.

[Loader utilities](https://loaders.gl/next/docs/modules/core/loader-utils.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core/loader-utils.md)[Range scheduler](https://loaders.gl/next/docs/modules/core/loader-utils/api-reference/range-request-scheduler.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core/loader-utils/api-reference/range-request-scheduler.md)[Readable files](https://loaders.gl/next/docs/modules/core/loader-utils/api-reference/readable-file.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core/loader-utils/api-reference/readable-file.md)

The remote-file path

## Pin the object. Request a range. Validate the response.

Cloud-native readers depend on exact byte ranges, but remote objects can change or servers can return unexpected responses. \`HttpFile\` keeps identity and transport validation together.

01

Open

Discover length and available validators

02

Read

Issue exact \`Range\` requests for byte intervals

03

Validate

Check status, Content-Range, length, and identity

04

Return

ArrayBuffer through the common ReadableFile contract

![From-v5.0](https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square)![experimental](https://img.shields.io/badge/experimental-yellow.svg?style=flat-square)

`HttpFile` provides validated random access to a remote object in browsers and Node.js. It sends exact HTTP range requests, pins the object's length and available validators, and rejects responses that no longer describe the same object.

Detailed guide

## Remote file and consistency details

The reference below covers opening, range reads, headers, validators, consistency modes, scheduling, telemetry, and failure behavior.

```
import {HttpFile} from '@loaders.gl/core/loader-utils';



const file = await HttpFile.open('https://example.com/data.parquet', {

  consistency: 'strict'

});



const footer = await file.read(file.size - 8, 8);

console.log(new Uint8Array(footer), file.getTelemetry());

await file.close();
```

The server must support byte ranges. A normal request must return `206 Partial Content` with an exact `Content-Range`; `HttpFile` deliberately rejects a `200 OK` full-object fallback. A valid zero-byte object may respond to the opening probe with `416 Range Not Satisfiable` and `Content-Range: bytes */0`.

## Opening a file[​](#opening-a-file "Direct link to Opening a file")

### `HttpFile.open(url, options?, signal?): Promise<HttpFile>`[​](#httpfileopenurl-options-signal-promisehttpfile "Direct link to httpfileopenurl-options-signal-promisehttpfile")

Creates a file and immediately pins its identity. Unless a complete identity is supplied, opening sends `Range: bytes=0-0` to discover the object length, `ETag`, and `Last-Modified` value.

Supplying a known length together with either validator avoids that opening request:

```
const file = await HttpFile.open(url, {

  byteLength: manifest.byteLength,

  etag: manifest.etag,

  consistency: 'strict'

});
```

### `new HttpFile(url, options?)`[​](#new-httpfileurl-options "Direct link to new-httpfileurl-options")

Creates a lazy file. The first call to `open()`, `stat()`, or `read()` discovers and pins the identity. Concurrent callers share one discovery request, while each caller can independently cancel its own wait.

Prefer the static `HttpFile.open()` form when code needs to use `size` synchronously.

## Options[​](#options "Direct link to Options")

| Option                | Type                                | Default             | Description                                                                                                                                 |
| --------------------- | ----------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `fetch`               | `(url, init?) => Promise<Response>` | `globalThis.fetch`  | Custom fetch implementation.                                                                                                                |
| `fetchOptions`        | `RequestInit`                       | none                | Headers, credentials, and other options copied to every request. `HttpFile` supplies the `GET` method, `Range` header, and combined signal. |
| `byteLength`          | `number`                            | discovered          | Trusted non-negative object length.                                                                                                         |
| `etag`                | `string`                            | discovered          | Trusted object ETag.                                                                                                                        |
| `lastModified`        | `string`                            | discovered          | Trusted Last-Modified value.                                                                                                                |
| `consistency`         | `'best-effort' \| 'strict'`         | `'best-effort'`     | Controls how missing validators are handled. Changed visible validators are always rejected.                                                |
| `rangeScheduler`      | `RangeRequestScheduler`             | private scheduler   | Shared scheduler used to coalesce compatible reads. Each `HttpFile` remains an isolated request context.                                    |
| `rangeSchedulerProps` | `RangeRequestSchedulerProps`        | `{batchDelayMs: 0}` | Configuration for the private scheduler. Ignored when `rangeScheduler` is supplied.                                                         |

`fetchOptions.headers` are preserved except for `Range`, which is set for each read. A signal in `fetchOptions` applies to every request; a signal passed to `open()` or `read()` applies only to that operation.

## Consistency modes[​](#consistency-modes "Direct link to Consistency modes")

### `best-effort`[​](#best-effort "Direct link to best-effort")

Rejects changed validators whenever the server exposes them. It permits a response that omits a previously visible validator, which is useful when a server or CORS policy does not expose headers consistently. If an ETag disappears but both responses expose `Last-Modified`, that fallback must still match.

### `strict`[​](#strict "Direct link to strict")

Requires every response to expose the pinned validator. If no validator was supplied, the opening response must expose either `ETag` or `Last-Modified`.

For cross-origin URLs, expose `Content-Range`, `ETag`, and `Last-Modified` through the server's CORS configuration when strict validation is required.

## Properties[​](#properties "Direct link to Properties")

### `size: number`[​](#size-number "Direct link to size-number")

Pinned object length. A lazy file reports a supplied `byteLength`, or zero until identity discovery has completed.

### `bigsize: bigint`[​](#bigsize-bigint "Direct link to bigsize-bigint")

The same object length represented as a bigint.

### `url: string`[​](#url-string "Direct link to url-string")

Remote object URL. `handle` contains the same value for the `ReadableFile` interface.

## Methods[​](#methods "Direct link to Methods")

### `open(signal?): Promise<this>`[​](#opensignal-promisethis "Direct link to opensignal-promisethis")

Pins the identity of a lazily constructed file. Repeated calls reuse the cached identity.

### `read(offset?, length?, signal?): Promise<ArrayBuffer>`[​](#readoffset-length-signal-promisearraybuffer "Direct link to readoffset-length-signal-promisearraybuffer")

Reads exactly `length` bytes starting at `offset`. Both values must be non-negative safe integers, and the range must not extend past `size`. A zero-length read returns an empty buffer without an HTTP request after identity is known.

Each non-empty response is accepted only when all of the following are true:

* the status is `206`;
* `Content-Range` exactly matches the requested offsets and pinned object length;
* visible validators are consistent with the pinned identity; and
* the consumed response body contains exactly the requested number of bytes.

### `stat(): Promise<Stat>`[​](#stat-promisestat "Direct link to stat-promisestat")

Returns the pinned `size`, `bigsize`, and `isDirectory: false`. It discovers identity first when the file is lazy.

### `getIdentitySnapshot(): HttpFileIdentity | null`[​](#getidentitysnapshot-httpfileidentity--null "Direct link to getidentitysnapshot-httpfileidentity--null")

Returns the frozen pinned `{byteLength, etag, lastModified}` object, or `null` before a lazy file has opened.

### `getTelemetry(): HttpFileTelemetry`[​](#gettelemetry-httpfiletelemetry "Direct link to gettelemetry-httpfiletelemetry")

Returns a frozen point-in-time snapshot:

```
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

### `fetchRange(offset, length, signal?): Promise<Response>`[​](#fetchrangeoffset-length-signal-promiseresponse "Direct link to fetchrangeoffset-length-signal-promiseresponse")

Compatibility method for `ReadableFile` consumers that expect a `Response`. New code should prefer `read()`.

### `close(): Promise<void>`[​](#close-promisevoid "Direct link to close-promisevoid")

Prevents new operations. Active requests remain controlled by their per-operation or persistent abort signals.

## Sharing a range scheduler[​](#sharing-a-range-scheduler "Direct link to Sharing a range scheduler")

Several files may share a [`RangeRequestScheduler`](https://loaders.gl/next/docs/modules/core/loader-utils/api-reference/range-request-scheduler.md) to centralize queue configuration and stats. `HttpFile` assigns every instance a private isolation key, so requests with different credentials, validators, or fetch implementations are never coalesced together.
