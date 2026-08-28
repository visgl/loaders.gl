# Overview

The `@loaders.gl/worker-utils` module provides the shared worker runtime used by loaders.gl
loaders, writers, compression codecs, and application-defined processors. It manages worker
creation, bounded concurrency, worker reuse, transferable data, cancellation, and stateful batch
sessions in browsers and Node.js.

## Installation

```bash
npm install @loaders.gl/worker-utils
```

## APIs

| API | Purpose |
| --- | --- |
| [`processOnWorker`](/docs/modules/worker-utils/api-reference/worker-processing#processonworker) | Run one atomic operation on a pooled worker. |
| [`processOnWorkerInBatches`](/docs/modules/worker-utils/api-reference/worker-processing#processonworkerinbatches) | Stream batches through one leased, stateful worker. |
| [`preloadWorker`](/docs/modules/worker-utils/api-reference/worker-processing#preloadworker) | Warm reusable workers before latency-sensitive work. |
| [`createWorker`](/docs/modules/worker-utils/api-reference/worker-processing#createworker) | Implement the atomic and batched operations exposed by a worker bundle. |
| [`WorkerFarm` and `WorkerPool`](/docs/modules/worker-utils/api-reference/worker-processing#pool-lifecycle) | Configure concurrency, reuse, and explicit shutdown. |

Use atomic processing for independent inputs. Use batched processing when parsing or encoding
requires state across input chunks, or when input and output should remain streaming rather than
being concatenated in memory.

