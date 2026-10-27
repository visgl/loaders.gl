---
title: Worker processing
description: Run atomic and streaming work in reusable browser or Node.js workers.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Worker utilities · processing API"
  title="Worker processing"
  description="Run loader, writer, and application-defined work off the main thread with bounded pools, transferable data, cancellation, and stateful streaming sessions."
  tone="blue"
  meta={['Browser and Node.js', 'Atomic and batched', 'Reusable pools']}
  links={[
    {label: 'Worker utilities', to: '/docs/modules/core/worker-utils'},
    {label: 'Worker loaders guide', to: '/docs/developer-guide/using-worker-loaders'},
    {label: 'Worker threads', to: '/docs/developer-guide/concepts/worker-threads'}
  ]}
/>

<DocOrientation
  eyebrow="The worker boundary"
  title="Move the expensive part. Keep the data flow understandable."
  description="The processing APIs cover both one-shot operations and stateful batch sessions, with backpressure and transferable ownership keeping memory and queue growth bounded."
  tone="blue"
  items={[
    {label: 'Atomic', value: 'One input, one result on a pooled worker'},
    {label: 'Batched', value: 'Stateful async input and output iterators'},
    {label: 'Transport', value: 'Transferable ArrayBuffer ownership'},
    {label: 'Lifecycle', value: 'Preload, reuse, cancellation, and replacement'}
  ]}
/>

<ReferenceBoundary
  title="Worker processing reference"
  description="The sections below document atomic work, batch sessions, worker creation, preload, transfer, and pool lifecycle behavior."
  tone="blue"
/>

`@loaders.gl/core/worker-utils` runs atomic and streaming operations on bounded pools of browser Web
Workers or Node.js worker threads.

## `processOnWorker`

Runs one independent operation and resolves with its result.

```typescript
const result = await processOnWorker(MyWorker, input, {
  worker: true,
  maxConcurrency: 3,
  reuseWorkers: true,
  signal
});
```

A worker descriptor may provide a `loadWorker()` factory for its default browser worker.
Bundler-facing packages typically use the standard static ES module construction pattern:

```typescript
const MyWorker = {
  // ...worker metadata
  worker: true,
  loadWorker: () =>
    new Worker(new URL('./workers/my-worker.js', import.meta.url), {type: 'module'})
};
```

Each invocation must return a fresh `Worker`. Returning `null`, or throwing while constructing the
worker, falls back to the descriptor's classic-worker URL or published CDN bundle. A classic worker
is the browser's non-module worker format, not CommonJS. Errors raised after construction do not
trigger automatic replay on a classic worker.

Inline source, an explicit `workerUrl`, and local test-worker options take precedence over
`loadWorker()`. Consequently, adding `loadWorker()` changes the default for compatible browser
builds without breaking applications that configure or self-host an existing worker bundle. Node.js
continues to use its platform-specific worker entry.

The input and result use transferable `ArrayBuffer` ownership where possible. Transferred input
buffers are detached on the calling thread.

## `processOnWorkerInBatches`

Streams an iterable of input batches through one leased worker and returns an `AsyncIterable` of
output batches.

```typescript
const outputBatches = processOnWorkerInBatches(MyWorker, inputBatches, {
  worker: true,
  maxConcurrency: 2,
  reuseWorkers: true,
  signal
});

for await (const outputBatch of outputBatches) {
  consume(outputBatch);
}
```

One pool worker is reserved for the complete iterator lifetime. The same `processInBatches`
invocation therefore receives every input batch and may retain parser, decoder, dictionary, or
encoder state between batches. Separate sessions may run concurrently on different workers.

Flow control is demand-driven in both directions:

- The calling thread advances the input iterator only when the leased worker requests another
  batch.
- The worker advances its output iterator only after the caller requests the next output batch.

At most one unacknowledged input and output batch is in flight for a session. This bounds queue
growth while preserving transferable ownership.

Stopping output iteration early or aborting the signal terminates the leased worker. This is a
hard cancellation: worker-side `finally` blocks are not guaranteed to run, but terminating the
worker releases its JavaScript and WebAssembly state. The pool creates a replacement worker for
later jobs. A supplied `AbortSignal.reason` is preserved.

## `createWorker`

Worker bundles expose atomic and optional batched processors with `createWorker`:

```typescript
createWorker(
  async (input, options) => processAtomically(input, options),
  async function* processInBatches(inputBatches, options) {
    const parser = new StatefulParser(options);
    try {
      for await (const inputBatch of inputBatches) {
        for (const outputBatch of parser.parse(inputBatch)) {
          yield outputBatch;
        }
      }
      yield* parser.finish();
    } finally {
      parser.destroy();
    }
  }
);
```

Keep per-session state inside `processInBatches`. Module-level state persists when workers are
reused and should be limited to intentionally shared resources such as an initialized WebAssembly
module.

`AbortSignal` and callback functions are controlled on the calling thread and are not cloned into
the worker. Communicate streaming progress by yielding output batches or including progress
metadata in those batches.

Codec workers can use this same session contract. For example,
`encodeDracoInBatches` keeps one Draco WebAssembly encoder alive while it consumes a sequence of
geometry batches, and only releases it when the iterator completes. Worker options are cloned for
each session: URL strings, booleans, and other structured-clone-safe values are supported, while
function-valued module injections such as a live `draco3d` object must be loaded on the worker or
replaced with URL-based library overrides.

## `preloadWorker`

Warms one or more workers in the same pool used by the processing APIs:

```typescript
await preloadWorker(MyWorker, {worker: true, maxConcurrency: 3}, {count: 2});
```

Preloading starts the worker bundle. Format-specific initialization can remain lazily cached in
module scope or can be triggered by the worker's atomic processor.

## Pool lifecycle

`WorkerFarm` owns one `WorkerPool` per worker name. Each pool queues jobs and enforces
`maxConcurrency`, `maxMobileConcurrency`, and `reuseWorkers`.

```typescript
WorkerFarm.getWorkerFarm({maxConcurrency: 3, reuseWorkers: true});

// Release idle workers and retire active workers after their jobs finish.
WorkerFarm.getWorkerFarm().destroy();
```

Set concurrency according to CPU and memory cost, particularly for WebAssembly codecs that create
one heap per worker. A stateful batch session occupies one concurrency slot until its output
iterator completes, is closed, fails, or is aborted.


## Cancellation and progress

Async loader calls (`parse`, `parseInBatches`, `load`, and `loadInBatches`) and worker processing
accept top-level `signal` and `onProgress` options:

```javascript
const controller = new AbortController();
const result = await parse(data, loader, {
  signal: controller.signal,
  onProgress: ({phase, completed, total, unit}) => {
    console.log(phase, completed, total, unit);
  }
});
// Call this from a cancel button while parsing is pending:
controller.abort();
```

Already aborted worker calls reject before scheduling or transferring input. Queued jobs reject
immediately without waiting for a free worker. Cancelling running work terminates its worker,
rejects with the signal's reason, and frees pool capacity for a replacement. Streaming cancellation
requests input iterator cleanup without waiting for a blocked `return()`. Completion and cancellation
settle a job once. `parquet.signal` remains a compatibility fallback; top-level `signal` takes priority.

Progress has the shape `{phase, completed, total?, unit}`. Measurements belong to their phase;
`total` is optional for indeterminate work. Do not combine download bytes and decoded rows into an
overall percentage. Parquet batch parsing reports decoded rows; Draco reports decode start and
completion in tasks. Other loaders and older/custom workers may produce no progress events.

Worker implementations call `context.reportProgress?.(...)` from their processor or loader context.
Frequent same-phase reports are coalesced before posting, phase changes are retained, and final
progress is flushed before completion. Reports stop after settlement. Signals and progress callbacks
stay on the calling thread. If a callback throws, the worker job is terminated and rejects with that
error. Callbacks should handle their own display errors when parsing should continue.

Cancellation also reaches fetch and nested parsing through loader context where supported.
Authenticated fetch, signing, and refresh/retry checks preserve the caller's abort reason.
Synchronous main-thread parsing cannot be interrupted while it blocks the event loop. Transferred
input buffers remain detached after cancellation; retain a copy if the application needs to retry.

## Batch-worker capability

`parseInBatches()` and `loadInBatches()` use a worker when the selected parser implements
`parseInBatches`, the loader declares `workerInBatches: true`, and the ordinary worker-selection
checks permit it. The worker stays leased for the iterator lifetime. Input is requested on demand;
output batches are acknowledged before more output is produced.

Built-in support includes CSV Arrow-table output, canonical Parquet Arrow/object-row batches,
incremental Arrow, GeoArrow, JSON, JSONTable, and NDJSON batches, and OBJ, PLY, and PCD
mesh batches. OBJ point-cloud and PLY vertex paths support incremental input; PCD currently
collects the complete input before returning output batches.
Loader authors can enable other loaders
by declaring `workerInBatches` in metadata, providing a worker created with `createLoaderWorker`,
and implementing compatible `serializeWorkerBatch` / `deserializeWorkerBatch` hooks when outputs
need transport conversion. Metadata entry points stay free of parser implementations.

```javascript
const batches = await parseInBatches(input, CSVLoader, {
  core: {worker: true},
  csv: {shape: 'arrow-table'}
});
for await (const batch of batches) {
  consume(batch);
}
```

An explicit worker URL or inline worker source has unknown protocol support. To use a compatible
custom worker, set `core.workerInBatches: true` as well as the loader capability. Set it to `false`
to keep batch parsing on the main thread. Existing atomic-only custom workers retain main-thread
batch parsing by default. Generated local test-worker URLs keep the built-in capability.

Node workers retain the experimental `core._nodeWorkers: true` opt-in and require a Node-loadable
worker artifact, such as a local `.cjs` worker. Worker-utils callers use the top-level
`workerInBatches` option and can inspect `canProcessOnWorkerInBatches()`.

Batch output and incremental input are separate capabilities. A parser that concatenates its input
still buffers the complete input inside the worker. Parquet currently has this behavior: output is
batched, but its input is collected before decoding. Parquet key-retriever callbacks keep parsing on
the caller, and the explicit WASM/GeoParquet loaders do not opt into this batch worker.
Parser options disable recursive worker dispatch
inside a worker; input transforms and loader selection remain on the caller.

### Portable loader options

A parser-bearing loader can provide `serializeWorkerOptions(options)` to convert option values
such as class instances into portable data before atomic or batch dispatch. The hook is synchronous,
must not mutate caller options, and returns the complete options object. Throwing rejects before a
worker job is scheduled or input buffers are transferred. Signals and progress callbacks remain on
the caller and are removed from the serialized options after this hook runs.

JSONTable and NDJSON use this hook to convert Apache Arrow schemas into loaders.gl schemas. Worker
selection still uses the caller's options; the hook prepares parser options after that decision.
