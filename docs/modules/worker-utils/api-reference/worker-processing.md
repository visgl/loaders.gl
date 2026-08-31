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
    {label: 'Worker utilities', to: '/docs/modules/worker-utils'},
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

`@loaders.gl/worker-utils` runs atomic and streaming operations on bounded pools of browser Web
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
