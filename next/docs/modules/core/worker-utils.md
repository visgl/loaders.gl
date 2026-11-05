Worker runtime

# Move expensive parsing without changing the loader API.

`@loaders.gl/core/worker-utils` is the shared runtime for loader, writer, codec, and application-defined workers. It manages task handles, bounded concurrency, transferable data, cancellation, and stateful batch sessions.

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

## Initialize a task. Transfer data. Close the handle.

Worker utilities keep the lifecycle and transport details behind a small API so a loader can offer background execution without duplicating pool, cancellation, or batch-session logic.

01

Operation

Atomic task or stateful batch session

02

Scheduling

Task runner with bounded concurrency

03

Transport

Transferable binary data where possible

04

Lifecycle

Upstream URL cleanup, Node workers, and cancellation

Detailed guide

## Worker processing details

The reference below covers processing helpers, worker creation, task lifetimes, batch sessions, transfer lists, and explicit cleanup.

The `@loaders.gl/core/worker-utils` module provides the shared worker runtime used by loaders.gl loaders, writers, compression codecs, and application-defined processors. It manages worker creation, bounded concurrency, task lifetimes, transferable data, cancellation, and stateful batch sessions in browsers and Node.js.

## Task feature support[​](#task-feature-support "Direct link to Task feature support")

| Feature                    | Support and limits                                                                                                                                                                                   |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Atomic and streaming tasks | One handle per atomic request; one retained handle for an entire batch stream.                                                                                                                       |
| Cancellation and progress  | Signals reach worker tasks and caller-thread callbacks; late callback results are discarded after shutdown.                                                                                          |
| Binary ownership           | Loader inputs transfer by default; opt into copy or shared storage. Callback ports transfer independently, and serializable caller context is copied.                                                |
| Worker URLs                | Factories, local module URLs, and cross-origin HTTP(S) module shims. Remote modules require CORS and compatible CSP.                                                                                 |
| Concurrency and cleanup    | Bounded active handles per descriptor; `destroyWorkerTasks()` terminates active and queued work and lets math.gl release worker-owned module shims. Queue memory must be bounded by the application. |
| Custom typed tasks         | Public math.gl `TaskRunner` and `createTypedTaskDispatcher` APIs with named object payloads and typed operations.                                                                                    |
| Initialization ownership   | Direct task runs accept `initializationOwnership` separately from input/output ownership. Loader callback ports transfer independently of payloads.                                                  |

## Installation[​](#installation "Direct link to Installation")

```
npm install @loaders.gl/core
```

## APIs[​](#apis "Direct link to APIs")

| API                                                                                                                                                    | Purpose                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| [`processOnWorker`](https://loaders.gl/next/docs/modules/core/worker-utils/api-reference/worker-processing.md#processonworker)                    | Run one atomic operation on a task handle.                              |
| [`processOnWorkerInBatches`](https://loaders.gl/next/docs/modules/core/worker-utils/api-reference/worker-processing.md#processonworkerinbatches)  | Stream batches through one leased, stateful worker.                     |
| [`preloadWorker`](https://loaders.gl/next/docs/modules/core/worker-utils/api-reference/worker-processing.md#preloadworker)                        | Preload code without retaining a worker or parser state.                |
| [`createWorker`](https://loaders.gl/next/docs/modules/core/worker-utils/api-reference/worker-processing.md#createworker)                          | Implement the atomic and batched operations exposed by a worker bundle. |
| [`TaskRunner` and `destroyWorkerTasks`](https://loaders.gl/next/docs/modules/core/worker-utils/api-reference/worker-processing.md#task-lifecycle) | Own task lifetimes and terminate loader task runners.                   |

Use atomic processing for independent inputs. Use batched processing when parsing or encoding requires state across input chunks, or when input and output should remain streaming rather than being concatenated in memory.

## Loading decoder libraries[​](#loading-decoder-libraries "Direct link to Loading decoder libraries")

Classic workers load classic decoder wrappers with `importScripts()`. Module workers use native `import()` and explicit factory exports; loaders.gl does not evaluate fetched JavaScript with `eval()` or `new Function()`. Draco, Basis, and Crunch ship generated `.mjs` factory adapters alongside their unchanged classic `.js` assets in `dist/libs`.

This removes fetched-source evaluation from worker-utils, not dynamic-code requirements inside vendored runtimes. In particular, the legacy Crunch runtime contains its own evaluation helpers; these adapters do not claim to make every codec compatible with a policy that forbids `unsafe-eval`.

Custom CDNs must serve these `.mjs` assets with a JavaScript MIME type and appropriate CORS headers. Module loading still follows the application's content security policy. When supplying a URL override through `modules`, use an ESM factory export for module workers; an override of the classic asset name is honored rather than silently replaced. Applications may instead inject a factory through `modules` on the main thread, avoiding external library loading altogether.

The optional fifth argument to `loadLibrary(url, moduleName, options, libraryName, moduleLibraryName)` selects the shipped ESM asset for module workers. Classic workers, the browser main thread, and Node.js continue using the classic asset. Without an ESM asset name, a module worker imports the supplied URL directly. Libraries that previously relied on `eval` installing globals must provide an ESM default or named export instead.

Worker execution delegates to the public `TaskRunner` and `initializeTaskWorker` APIs from math.gl beta.4. URL-backed tasks delegate module loading and shim cleanup to math.gl. Nullable legacy loader factories retain a small URL-fallback adapter because the public task API currently accepts either a URL or a factory. Loader helpers retain parser options, progress, cancellation, and calling-thread callbacks. Streaming parsers use one initialized handle for the complete stream. Rebuild custom worker bundles when upgrading; legacy pool and message-protocol APIs are removed. See the [worker API migration](https://loaders.gl/next/docs/upgrade-guide.md#worker-task-runtime).
