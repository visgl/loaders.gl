Worker runtime

# Move expensive parsing without changing the loader API.

`@loaders.gl/core/worker-utils` is the shared runtime for loader, writer, codec, and application-defined workers. It manages pooling, bounded concurrency, transferable data, cancellation, and stateful batch sessions.

[Worker APIs](https://loaders.gl/next/docs/modules/core/worker-utils/api-reference/worker-processing.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core/worker-utils/api-reference/worker-processing.md)[Worker loaders guide](https://loaders.gl/next/docs/developer-guide/using-worker-loaders.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/using-worker-loaders.md)[Worker threads](https://loaders.gl/next/docs/developer-guide/concepts/worker-threads.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/concepts/worker-threads.md)

Worker execution

## Keep parsing off the interaction path.

loaders.gl transfers binary input to a reusable worker and returns parsed data while the main thread remains available for rendering and input.

Main thread

Fetch bytesRender UIHandle input

transfe&#x72;**→**

Worker pool

worker 01worker 02

parse · decompress · transform

retur&#x6E;**→**

Application data

TablesMeshesImages

The worker boundary

## Lease a worker. Transfer data. Reuse the runtime.

Worker utilities keep the lifecycle and transport details behind a small API so a loader can offer background execution without duplicating pool, cancellation, or batch-session logic.

01

Operation

Atomic task or stateful batch session

02

Scheduling

Reusable pool with bounded concurrency

03

Transport

Transferable binary data where possible

04

Lifecycle

Preload, cancellation, errors, and shutdown

Detailed guide

## Worker processing details

The reference below covers processing helpers, worker creation, pools, batch sessions, transfer lists, and explicit cleanup.

The `@loaders.gl/core/worker-utils` module provides the shared worker runtime used by loaders.gl loaders, writers, compression codecs, and application-defined processors. It manages worker creation, bounded concurrency, worker reuse, transferable data, cancellation, and stateful batch sessions in browsers and Node.js.

## Installation[​](#installation "Direct link to Installation")

```
npm install @loaders.gl/core
```

## APIs[​](#apis "Direct link to APIs")

| API                                                                                                                                                   | Purpose                                                                 |
| ----------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| [`processOnWorker`](https://loaders.gl/next/docs/modules/core/worker-utils/api-reference/worker-processing.md#processonworker)                   | Run one atomic operation on a pooled worker.                            |
| [`processOnWorkerInBatches`](https://loaders.gl/next/docs/modules/core/worker-utils/api-reference/worker-processing.md#processonworkerinbatches) | Stream batches through one leased, stateful worker.                     |
| [`preloadWorker`](https://loaders.gl/next/docs/modules/core/worker-utils/api-reference/worker-processing.md#preloadworker)                       | Warm reusable workers before latency-sensitive work.                    |
| [`createWorker`](https://loaders.gl/next/docs/modules/core/worker-utils/api-reference/worker-processing.md#createworker)                         | Implement the atomic and batched operations exposed by a worker bundle. |
| [`WorkerFarm` and `WorkerPool`](https://loaders.gl/next/docs/modules/core/worker-utils/api-reference/worker-processing.md#pool-lifecycle)        | Configure concurrency, reuse, and explicit shutdown.                    |

Use atomic processing for independent inputs. Use batched processing when parsing or encoding requires state across input chunks, or when input and output should remain streaming rather than being concatenated in memory.

## Loading decoder libraries[​](#loading-decoder-libraries "Direct link to Loading decoder libraries")

Classic workers load classic decoder wrappers with `importScripts()`. Module workers use native `import()` and explicit factory exports; loaders.gl does not evaluate fetched JavaScript with `eval()` or `new Function()`. Draco, Basis, and Crunch ship generated `.mjs` factory adapters alongside their unchanged classic `.js` assets in `dist/libs`.

This removes fetched-source evaluation from worker-utils, not dynamic-code requirements inside vendored runtimes. In particular, the legacy Crunch runtime contains its own evaluation helpers; these adapters do not claim to make every codec compatible with a policy that forbids `unsafe-eval`.

Custom CDNs must serve these `.mjs` assets with a JavaScript MIME type and appropriate CORS headers. Module loading still follows the application's content security policy. When supplying a URL override through `modules`, use an ESM factory export for module workers; an override of the classic asset name is honored rather than silently replaced. Applications may instead inject a factory through `modules` on the main thread, avoiding external library loading altogether.

The optional fifth argument to `loadLibrary(url, moduleName, options, libraryName, moduleLibraryName)` selects the shipped ESM asset for module workers. Classic workers, the browser main thread, and Node.js continue using the classic asset. Without an ESM asset name, a module worker imports the supplied URL directly. Libraries that previously relied on `eval` installing globals must provide an ESM default or named export instead.
