Core streaming API

# Decode a stream one batch at a time.

Use `parseInBatches()` when the input can arrive incrementally and the application can start work before the complete resource is available. The async iterator yields metadata and data in the shape defined by the loader.

[Core module](https://loaders.gl/next/docs/modules/core.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core.md)[Load in batches](https://loaders.gl/next/docs/modules/core/api-reference/load-in-batches.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core/api-reference/load-in-batches.md)[Streaming guide](https://loaders.gl/next/docs/developer-guide/using-streaming-loaders.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/using-streaming-loaders.md)

The batch boundary

## Read, yield, process, continue.

A batch is not always a row array. Depending on the loader it may contain metadata, a schema, table rows, geometry, or another category-specific result.

01

Input

Response, stream, iterator, or supported loaded data

02

Selection

Explicit loader or registered autodetection

03

Yield

Metadata and data through an async iterator

04

Control

Loader options, backpressure, and cancellation

The `parseInBatches` function can parse incrementally from a stream of data as it arrives and emit "batches" of parsed data.

Batched parsing is most useful with loaders that emit meaningful partial results. Check each loader's documentation for its batch shape and streaming behavior.

When a loader does not implement a specialized batch parser, `parseInBatches()` can fall back to waiting for the complete input and emitting one batch. In that case it has the same memory profile as an atomic parse.

### Worker-backed batch parsing[​](#worker-backed-batch-parsing "Direct link to Worker-backed batch parsing")

Some loaders can keep a parser session on one worker while input fragments arrive. The worker is leased when the returned iterator starts and remains the same for that iterator, so state such as partial records, dictionaries, and UTF-8 boundaries can span fragments. Input and output are demand-driven: the source is not advanced until the worker requests another fragment, and the worker does not produce the next output until the application requests it. This keeps at most a bounded amount of data in flight.

The worker is returned to the pool after normal completion. If the iterator is aborted, fails, or is closed early, its worker is terminated and a fresh worker is used for later sessions. Close an iterator that the application abandons (`await iterator.return?.()`) rather than leaving a session active. Transferred binary fragments can be detached on the calling thread; copy a fragment first if the application must retain its bytes. Loader-specific serializers can hydrate results such as Arrow tables after they cross the worker boundary.

`core.worker: 'auto'` is currently an atomic `parse()` policy. Batched parsing keeps the loader's existing worker or main-thread behavior, including the CSV Arrow-table pilot. See the [worker loaders guide](https://loaders.gl/next/docs/developer-guide/using-worker-loaders.md) for lifecycle, fallback, and transport details.

caution

When calling a sub-loader from inside a loader, do not use this public function. Use the `parseInBatchesFromContext` counterparts in `@loaders.gl/core/loader-utils`.

## Usage[​](#usage "Direct link to Usage")

Detailed guide

## Batch parsing details

The reference below covers batch-compatible loaders, metadata batches, input types, loader selection, and options.

Parse CSV in batches (emitting a batch of rows every time data arrives from the network):

```
import {fetchFile, parseInBatches} from '@loaders.gl/core';

import {CSVLoader} from '@loaders.gl/tables/csv';



const batchIterator = await parseInBatches(fetchFile(url), CSVLoader);

for await (const batch of batchIterator) {

  console.log(batch.data);

}
```

Parse CSV in batches, requesting an initial metadata batch:

```
import {fetchFile, parseInBatches} from '@loaders.gl/core';

import {CSVLoader} from '@loaders.gl/tables/csv';



const batchIterator = await parseInBatches(fetchFile(url), CSVLoader, {metadata: true});

for await (const batch of batchIterator) {

  switch (batch.batchType) {

    case 'metadata':

      console.log(batch.metadata);

      break;

    default:

      processBatch(batch.data);

  }

}
```

## Functions[​](#functions "Direct link to Functions")

### async parseInBatches(data: DataType, loaders: Loader | Loader\[], options?: LoaderOptions): `Promise<AsyncIterable>`[​](#async-parseinbatchesdata-datatype-loaders-loader--loader-options-loaderoptions-promiseasynciterable "Direct link to async-parseinbatchesdata-datatype-loaders-loader--loader-options-loaderoptions-promiseasynciterable")

### async parseInBatches(data: DataType, options?: LoaderOptions): `Promise<AsyncIterable>`[​](#async-parseinbatchesdata-datatype-options-loaderoptions-promiseasynciterable "Direct link to async-parseinbatchesdata-datatype-options-loaderoptions-promiseasynciterable")

Parses data in batches from a stream, releasing each batch to the application while the stream is still being read.

Parses data with the selected *loader object*. An array of `loaders` can be provided, in which case an attempt will be made to autodetect which loader is appropriate for the file (using the URL extension and header matching).

* `data`: loaded data or an object that allows data to be loaded. See the table below for valid types.
* `loaders` can be a single loader or an array of loaders. If omitted, the list of registered loaders is used (see `registerLoaders`).
* `options`: See [`LoaderOptions`](https://loaders.gl/next/docs/modules/core/api-reference/loader-options.md) for documentation of options.
* `url`: optional, assists in the autoselection of a loader if multiple loaders are supplied to `loader`.

Returns an async iterator that yields loader-defined batches. The exact batch shape depends on the loader's category data and may include metadata before data batches.

Notes:

* The `loaders` parameter can also be omitted, in which case any *loaders* previously registered with [`registerLoaders`](https://loaders.gl/next/docs/modules/core/api-reference/register-loaders.md) will be used.

## Input Types[​](#input-types "Direct link to Input Types")

| Input                                    | Description                                                                                |
| ---------------------------------------- | ------------------------------------------------------------------------------------------ |
| `Response`                               | A response returned by `fetch()` or `fetchFile()`; its body can be consumed incrementally. |
| `ArrayBuffer`, `Uint8Array`, or `string` | Already loaded binary or textual data.                                                     |
| `File` or `Blob`                         | Browser file data.                                                                         |
| `Iterator` or `AsyncIterator`            | Binary or textual chunks for loaders that support streaming input.                         |
| `ReadableStream`                         | A DOM or Node stream.                                                                      |
| `Promise`                                | A promise resolving to any supported input type.                                           |

Many other data sources can also be wrapped in a `Response` before parsing, including data URLs, `ArrayBuffer`, `File`, `Blob`, and `ReadableStream` values.
