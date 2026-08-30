---
title: Worker utilities
description: Run loader and writer work off the main thread with reusable workers.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {WorkerFlowGraphic} from '@site/src/components/docs/capability-flow-graphics';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Worker runtime"
  title="Move expensive parsing without changing the loader API."
  description="`@loaders.gl/worker-utils` is the shared runtime for loader, writer, codec, and application-defined workers. It manages pooling, bounded concurrency, transferable data, cancellation, and stateful batch sessions."
  tone="blue"
  meta={['Browser and Node.js', 'Worker pools', 'Transferable data']}
  links={[
    {label: 'Worker APIs', to: '/docs/modules/worker-utils/api-reference/worker-processing'},
    {label: 'Worker loaders guide', to: '/docs/developer-guide/using-worker-loaders'},
    {label: 'Worker threads', to: '/docs/developer-guide/concepts/worker-threads'}
  ]}
/>

<WorkerFlowGraphic />

<DocOrientation
  eyebrow="The worker boundary"
  title="Lease a worker. Transfer data. Reuse the runtime."
  description="Worker utilities keep the lifecycle and transport details behind a small API so a loader can offer background execution without duplicating pool, cancellation, or batch-session logic."
  tone="blue"
  items={[
    {label: 'Operation', value: 'Atomic task or stateful batch session'},
    {label: 'Scheduling', value: 'Reusable pool with bounded concurrency'},
    {label: 'Transport', value: 'Transferable binary data where possible'},
    {label: 'Lifecycle', value: 'Preload, cancellation, errors, and shutdown'}
  ]}
/>

<ReferenceBoundary
  title="Worker processing details"
  description="The reference below covers processing helpers, worker creation, pools, batch sessions, transfer lists, and explicit cleanup."
  tone="blue"
/>

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
