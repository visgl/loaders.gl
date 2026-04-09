# Multi-Range Loading

Some source formats store many tiles, point-cloud nodes, or image blocks inside one large
object. Loading each tile with an independent HTTP request can waste round trips; loading the
entire object can waste bandwidth. loaders.gl Sources can use scheduled byte-range loading to
take the middle path.

## How It Works

When a Source can resolve an application request to a byte offset and length, it can enqueue
that range in the shared `TileRangeRequestScheduler`.

The scheduler:

- waits for `tileRangeRequest.batchDelayMs`
- sorts queued reads by URL and byte offset
- expands a request by up to `tileRangeRequest.rangeExpansionBytes` to include a nearby read
- rejects a merge that would exceed `tileRangeRequest.maxMergedBytes`
- issues the merged HTTP `Range` request
- slices the merged response back into one promise per original tile, node, or image block

This is automatic for supported URL Sources. Callers can keep using `getTile()`,
`getTileData()`, `getImage()`, `getPoints()`, or `loadNodeContent()`.

## Options

| Option                                  | Default   | Meaning |
| --------------------------------------- | --------- | ------- |
| `tileRangeRequest.batchDelayMs`         | `50`      | Time to wait for sibling tile/node/image requests before starting transport. |
| `tileRangeRequest.rangeExpansionBytes`  | `65536`   | Maximum byte gap to over-fetch when expanding one range to include the next close range. |
| `tileRangeRequest.maxGapBytes`          | `65536`   | Compatibility alias for `rangeExpansionBytes`. |
| `tileRangeRequest.maxMergedBytes`       | `8388608` | Maximum byte length of one merged range request. |
| `tileRangeRequest.maxConcurrentRequests` | `6`      | Reserved concurrency hint; transports may use it as they grow. |
| `tileRangeRequest.stats`                | none      | Optional probe.gl `Stats` object that receives shared scheduler counters. |
| `tileRangeRequest.onEvent`              | none      | Optional callback that receives scheduler diagnostics for queued, batched, completed, failed, and aborted range requests. |

Use `batchDelayMs: 0` when latency matters more than gathering sibling requests. Use a larger
`rangeExpansionBytes` when sibling tiles are usually close together and the server is far away.
Use a smaller `rangeExpansionBytes` when bandwidth is more constrained than request count.

## Single-Range vs Multi-Range

The shared scheduler currently merges close requests into one contiguous single-range read.
That makes it compatible with object stores and CDNs that support standard HTTP range
requests.

Test servers in this repository can also return HTTP `multipart/byteranges` responses. That
allows loaders and Sources to be tested against comma-separated Range headers even when the
production transport chooses single, expanded ranges.

## Local Range Server

Website examples that need local PMTiles, COG, OME-TIFF, COPC, or Potree 2 data can point at
a companion loaders.gl range server. The server serves a directory with CORS, regular `200`
responses, single `206` byte-range responses, and multipart `206` responses for
comma-separated `Range` headers.

Ask example users to clone loaders.gl, install dependencies, choose a local data directory,
and run the server in a separate terminal:

```bash
git clone https://github.com/visgl/loaders.gl.git
cd loaders.gl
yarn install
yarn serve-range --root ./modules/pmtiles/test/data/pmtiles-v3 --port 9000
```

Then configure the website example with URLs below that server root:

```ts
const localPmtilesUrl = 'http://127.0.0.1:9000/stamen_toner(raster)CC-BY+ODbL_z3.pmtiles';
const localCogUrl = 'http://127.0.0.1:9000/example-cog.tif';
```

Do not ask users to import these large archives into the website bundle. Fetch them by URL so
the Source can send HTTP `Range` headers.

The server requires an explicit `--root` directory. Put only demo data in that directory when
using the default permissive CORS setting.

## Website Example Pattern

A website example can first try a configured URL. If that request fails because the local range
server is not running, show an inline instruction with the exact command that matches the
example's expected data directory. Keep the heavy data out of git and out of the website
static folder unless it is intentionally published as a small fixture.

Production examples should keep using public URLs from object storage or a CDN with normal
single-range support. The local server is for contributors, reviewers, and examples that use
private or very large data.

## Diagnostics

Pass either a probe.gl `Stats` object or an `onEvent` callback when you need to understand
range behavior:

```ts
const source = createDataSource(url, [PMTilesSource], {
  tileRangeRequest: {
    onEvent: event => console.log(event.type, event)
  }
});
```

The shared scheduler reports logical caller ranges, batches, merged transport ranges, response
bytes, overfetch bytes, failed transport requests, aborted logical requests, and full-response
fallbacks.

## Servers That Ignore Range Headers

URL range transports send an abortable `fetch()` request with a `Range` header and expect a
`206 Partial Content` response. If the server responds with `200 OK`, the transport aborts the
fetch immediately, cancels the response body, and rejects the range request instead of reading
a whole PMTiles, GeoTIFF, COPC, or Potree object into memory.

## Blob And In-Memory Sources

Blob-backed Sources usually read slices directly from the Blob and bypass the default
`batchDelayMs`. The delay is intended to collect network work. Tests can still use Blobs in
node to exercise metadata parsing and decode paths without starting an HTTP server.

## Failure And Abort Behavior

Each caller receives an independent promise. If a caller aborts before the batch starts, that
request is rejected and removed. If a merged transport request fails, every child range in that
merged request is rejected.
