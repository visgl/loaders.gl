# Worker processing

`@loaders.gl/core/worker-utils` adapts loader and writer requests to the public
`TaskRunner` API from `@math.gl/tasks`. Worker transport and pool internals are
not exported. Atomic calls own one initialized task handle; a streaming call keeps
one handle for the entire input iterator and releases it on completion or early return.

## processOnWorker

```typescript
import {processOnWorker} from '@loaders.gl/core/worker-utils';

const result = await processOnWorker(workerDescriptor, input, {
  worker: true,
  signal,
  inputOwnership: 'copy',
  onProgress: progress => console.log(progress)
});
```

The descriptor's `loadWorker()` factory takes precedence over its published URL.
An explicit `options[descriptor.id].workerUrl` override or `_workerType: 'test'`
selects the configured URL instead. Factories must return a fresh worker or `null`
to use the URL. Cross-origin HTTP(S) module entrypoints use a same-origin blob shim
that imports the remote module; the remote server must allow CORS and your CSP must
allow the worker and module import. Shutdown revokes the shim URLs. Custom workers must install the current task protocol with
`createWorker` or `createLoaderWorker`; rebuild older worker bundles.

Loader helpers retain their transfer-by-default input semantics. Set
`inputOwnership: 'copy'` to preserve caller buffers. The public math.gl `TaskRunner`
itself defaults to copying input. Output transfers by default; `outputOwnership:
'copy'` requests copied output. Signals and progress callbacks stay on the calling
thread, separate from portable parser options. Explicit `null` option values remain
`null`, including nested defaults such as `core.fetch` and `core.CDN`.

The optional fourth argument supplies a `process` callback for work requested by
the worker on its calling thread. The fifth argument supplies serializable loader
context. The adapter carries callbacks over a private `MessagePort` owned by the
handle, rather than exporting or patching math.gl's internal transport protocol.
The callback receives cancellation through its worker context's `signal`. Loader
callbacks propagate that signal into the nested parse context. Callbacks should honor that signal; late results after cancellation or
shutdown are discarded. Callback ports always transfer during initialization,
independently of payload ownership. Serializable context is copied so caller buffers
remain usable.

## processOnWorkerInBatches

```typescript
import {processOnWorkerInBatches} from '@loaders.gl/core/worker-utils';

for await (const batch of processOnWorkerInBatches(workerDescriptor, inputChunks, {
  worker: true,
  signal
})) {
  consume(batch);
}
```

This calls the task's streaming processor once with the entire iterator. Parser
state and loader context persist between chunks. Input demand and output
backpressure come from the initialized task handle. Completing, aborting, throwing,
or returning early closes the handle and its callback channel. If worker initialization
or option validation fails, or a queued request is cancelled, input cleanup is requested without waiting
for a potentially blocked iterator `return()`; the original failure is preserved.

`canProcessOnWorker` checks runtime support, descriptor capability, and explicit
worker opt-in. Node loader APIs also require `core._nodeWorkers: true`.
`canProcessOnWorkerInBatches` additionally checks the loader's batch capability.
A custom URL must explicitly declare `workerInBatches: true`.

## preloadWorker

`await preloadWorker(descriptor, options, {signal})` delegates to `preloadTasks`.
It loads code using a temporary worker, then terminates that worker. It does not
reserve parser state, prewarm a reusable pool, or accept a worker `count`.

## createWorker

Inside a worker entry point:

```typescript
import {createWorker} from '@loaders.gl/core/worker-utils';

await createWorker(
  async (input, options, context, loaderContext) => decode(input, options),
  async function* (inputs, options, context, loaderContext) {
    for await (const input of inputs) yield decodeChunk(input, options);
  }
);
```

The adapter installs `initializeTaskWorker`, wraps arbitrary loader values in
named task payloads, and supplies cancellation, progress, and optional caller-thread
processing in `context`. Importing this entry point on the main thread does not
install worker handlers. A worker bundle installs exactly one task implementation.

## Task lifecycle

`TaskRunner`, `initializeTaskWorker`, `preloadTasks`, `createTypedTaskDispatcher`, and their public task types are
imported directly from `@math.gl/tasks`. Use them for application-defined typed
tasks; task input and output are plain objects with named fields.

`maxConcurrency` limits active handles for one loader descriptor. Handles are
closed after each atomic call or streaming session. The legacy `reuseWorkers`,
`source`, `workerType`, debug callbacks, and direct pool controls are not task
lifecycle controls. Inline `source` is rejected; provide a module-worker URL or
factory instead.

`await destroyWorkerTasks()` terminates the loader adapters' active and queued
requests. New requests create new runners. For a `TaskRunner` you own directly,
call its `close()` or `terminate()` method.

## Other utilities

`getWorkerURL` and `validateWorkerVersion` continue to resolve loaders.gl artifacts
and check their metadata. `getTransferList` includes MessageChannel ports and binary
buffers. `loadLibrary` continues to resolve decoder assets; see
[decoder library loading](/docs/modules/core/worker-utils#loading-decoder-libraries).

### Typed operations and initialization ownership

Use `createTypedTaskDispatcher` for a persistent task with multiple named operations.
It preserves each operation's request and result types while using the same task handle.
Direct `TaskRunner.runTask` and `runTaskInBatches` calls accept
`initializationOwnership` independently of `inputOwnership` and `outputOwnership`.
For example, copy a reusable initialization template while transferring each input.
Explicit `initializeTask` handles still use `inputOwnership` for their setup argument.
Loader helpers already transfer their private callback port separately from payload ownership.
