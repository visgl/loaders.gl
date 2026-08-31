---
title: Using worker loaders
description: Move expensive parsing and decompression away from the browser interaction path.
hide_title: true
page_style: designed
---

import {CapabilityHero} from '@site/src/components/docs/capability-hero';
import {WorkerFlowGraphic} from '@site/src/components/docs/capability-flow-graphics';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<CapabilityHero capability="workers" />

<WorkerFlowGraphic />

<DocOrientation
  eyebrow="Worker execution"
  title="Keep parsing off the interaction path."
  description="Worker-enabled loaders move parsing, decompression, and transforms into reusable worker bundles while the main thread continues to render, respond, and coordinate the application."
  tone="blue"
  items={[
    {label: 'Use it when', value: 'Parsing or decompression competes with interaction'},
    {label: 'Moves off thread', value: 'Binary parsing, compression, and format transforms'},
    {label: 'Works best for', value: 'Binary inputs that can be transferred efficiently'},
    {label: 'Control when needed', value: 'Worker, reuse, concurrency, and script URL options'}
  ]}
/>

## Start here

Worker-enabled loaders keep expensive parsing and decompression away from the browser's UI thread.
For most applications, choose the loader normally and let loaders.gl manage its worker; the options
below are available when you need more control.

Most loaders.gl loaders can perform parsing on JavaScript worker threads.
This means that the main thread will not block during parsing and can continue
to respond to user interactions or do parallel processing.

Worker threads can also run in parallel, increasing your application's performance
when loading many files in parallel.

Note that worker thread loading is not always the best choice since the transfer of
data between workers and the main thread is only efficient if the data is predominantly
binary.

When worker thread loading is not offered in a specific loader it is usually
because it would not provide any performance benefits.

Another advantage when using pure worker loaders is that the code required to
parse a format is not bundled into the application but loaded on demand. This is
particularly useful when adding loaders that are only used occasionally by your
application.

For the tradeoffs and lifecycle details, see the [Worker Threads](./concepts/worker-threads)
article in the concepts section.

<ReferenceBoundary
  title="The worker runtime"
  description="The detailed guide covers worker processing, parallel loading, reuse, transfer semantics, custom scripts, composite loaders, and debugging."
  tone="blue"
/>

## Processing data on workers

The `processOnWorker` function in `@loaders.gl/worker-utils` is used with worker objects
exported by modules like `@loaders.gl/compression` and `@loaders.gl/crypto` to move
processing-intensive tasks to workers.

`processOnWorkerInBatches` leases one worker for an entire input iterator. This lets streaming
parsers and encoders retain state across chunks while applying input and output backpressure.
See the [worker processing API](/docs/modules/worker-utils/api-reference/worker-processing) for
worker implementation, cancellation, transfer, and lifecycle guidance.

## Parsing data on workers

Most worker-enabled loaders use the same `load` and `parse` APIs as their main-thread
counterparts. The loader reference identifies whether a loader has a worker bundle and
whether it needs additional codec assets.

## Loading files in parallel

`DracoLoader` is a worker-enabled loader that parses Draco-compressed meshes away from
the main thread. Multiple calls can use the worker pool concurrently:

```typescript
import {load} from '@loaders.gl/core';
import {DracoLoader} from '@loaders.gl/draco';

async function loadInParallel(url1, url2) {
  const [data1, data2] = await Promise.all([load(url1, DracoLoader), load(url2, DracoLoader)]);
}
```

## Disabling worker loaders

Applications can use `core.worker: false` to disable worker execution, for instance to
simplify debugging of parsing issues:

```typescript
async function loadWithoutWorker(url1) {
  const data = await load(url1, DracoLoader, {core: {worker: false}});
}
```

## Disabling worker reuse

Applications reuse already-created workers by default. Some codec runtimes retain sizeable
allocations while a worker remains alive, so disabling reuse can help when processing
multiple datasets sequentially or investigating memory growth.
Set `core.reuseWorkers: false` when an application needs to release worker state between
sequential datasets or is diagnosing retained memory:

```typescript
async function loadWithFreshWorker(url1) {
  const data = await load(url1, DracoLoader, {core: {reuseWorkers: false}});
}
```

## Concurrency and worker reuse

`core.maxConcurrency` and `core.maxMobileConcurrency` control how many worker instances
each loader may create. Increasing these limits can help when several large files are
loaded at once, but setting them above roughly the number of CPU cores usually adds
overhead without improving throughput.

Workers remain available for reuse by default. This avoids startup costs for subsequent
loads, but retained workers also retain their runtime and codec memory. Set
`core.reuseWorkers: false` when that memory should be released after each job.

## ArrayBuffer transfer

Be aware that worker loaders transfer binary data from the calling thread to the worker
thread. When using `parse`, an `ArrayBuffer` passed to the worker may be *neutered* and
no longer accessible in the calling thread.

Most applications do not need to process the raw binary data after parsing, so this is
rarely an issue. If you do, copy the data before parsing or disable worker execution (see
above).

## Module and classic workers

In loaders.gl 5.0, a loader can provide a bundled ES module worker as its default browser worker.
The loader uses the browser's standard module-worker pattern:

```typescript
new Worker(new URL('./workers/example-worker.js', import.meta.url), {type: 'module'});
```

Compatible bundlers can discover this static expression and include the worker module in the
application build. This avoids a runtime CDN dependency and lets the worker use ES module imports.
Arrow triangulation is the first loaders.gl API to provide this path.

Loaders without a module-worker factory continue to use their existing pre-built worker. A loader
with both formats selects its module worker by default and retains the pre-built worker as a
compatibility fallback. In browser terminology this fallback is a **classic worker**: a standalone
script loaded without `{type: 'module'}`. It is not a CommonJS worker. CommonJS is relevant to the
Node.js package build, while browser classic workers normally use a self-contained bundle and may
use `importScripts()`.

Worker targets are selected in this order:

1. Inline `source`, primarily for tests and advanced integrations.
2. An explicit loader-scoped `workerUrl`.
3. A local test worker when `_workerType: 'test'` is set.
4. The loader's built-in module-worker factory, when available in a browser.
5. The existing pre-built classic-worker bundle from the package or loaders.gl CDN.

If the factory returns `null` or throws while creating the worker, loaders.gl uses the classic-worker
URL. Failures that happen after the browser has successfully constructed the worker are reported as
worker errors; loaders.gl cannot safely replay an in-flight job automatically.

Explicit `workerUrl` settings retain classic-worker behavior. Existing classic workers are not
deprecated by the module-worker API, and applications do not need to change their worker options.

## Specifying Worker Script URLs (Advanced)

As an advanced option, an application can specify an alternate URL for a pre-built
worker loader instance.

This can be useful when building applications that cannot access CDNs, creating highly
customized application builds, or doing in-depth debugging.

```typescript
/**
 * For instance, with vite.
 *
 * https://vitejs.dev/guide/assets.html#explicit-url-imports
 */
import mvtLoaderUrl from '@loaders.gl/mvt/mvt-worker.js?url';
```

## Composite Loaders and Workers (Advanced)

loaders.gl supports sub-loader invocation from worker loaders.

A worker loader starts a separate thread with a JavaScript bundle that contains the code
for that loader. If it invokes a sub-loader, the request may cross the main thread and
another worker boundary, with loaders.gl transferring the input and result between them.

## Debugging Worker Loaders (Advanced)

Debugging worker loaders can be easier if you first set `core.worker: false` to confirm
whether an issue is specific to worker execution. For worker-specific issues, use an
explicit local worker URL and a non-minified application build so the worker request and
message boundary can be inspected directly in the browser's developer tools.
