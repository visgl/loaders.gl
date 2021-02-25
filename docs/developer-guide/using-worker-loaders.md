## Using Workers

Most loaders.gl loaders can perform parsing on JavaScript worker threads.
This means that the main thread will not block during parsing and can continue
to respond to user interactions or do parallel processing.

Worker threads can also run in parallel, increasing your application's performance
when loading parsing many files in parallel.

Note that worker thread loading is not always the best choice since the transfer of
data between workers and the main thread is only efficient if the data is predominantly
binary.

When worker thread loading is not offered in a specific loader it is usually
because it would not provide any performance benefits.

Another advantage when using pure worker loaders is that the code required to
parse a format is not bundled into the application but loaded on demand. This is
particularly useful when adding loaders that are only used occasionally by your
application.

More details on advantages and complications with worker thread based loading the [Worker Threads](./concepts/worker-threads.md) article in the concepts secion.

## Processing Data on Workers

The `processOnWorker` function in `@loaders.gl/worker-utils` is used with worker objects
exported by modules like `@loaders.gl/compression` and `@loaders.gl/crypto` to move
processing intensive tasks to workers.

## Parsing data on Workers

## Loading Files in Parallel using Worker Loaders

The `DracoLoader` is an example of a worker enabled loader. It parses data on worker threads by default. To load two Draco encoded meshes _in parallel_ on worker threads, just use the `DracoLoader` as follows:

```js
import {load} from '@loaders.gl/core';
import {DracoLoader} from '@loaders.gl/draco';

async function loadInParallel(url1, url2) {
  const [data1, data2] = await Promise.all([load(url1, DracoLoader), load(url2, DracoLoader)]);
}
```

## Disabling Worker Loaders

Applications can use the `worker: false` option to disable worker loaders, for instance to simplify debugging of parsing issues:

```js
async function loadwWithoutWorker(url1) {
  const data = await load(url1, DracoLoader, {worker: false});
}
```

## Disabling Reuse of Workers

Applications reuse already created workers by default. To avoid `enlarge memory arrays` error it is really nesessary to disable it if you need to load multiple datasets in a sequence.
This functionality can be disabled by `reuseWorkers: false` option:

```js
async function loadwWithoutWorker(url1) {
  const data = await load(url1, DracoLoader, {worker: true, reuseWorkers: false});
}
```

## Concurrency Level and Worker Reuse

Concurrency - The `options.maxConcurrency` and `option.maxMobileConcurrency` options can be adjusted to define how many worker instances should be created for each format. Note that setting this higher than roughly the number CPU cores on your current machine will not provide much benefit and may create extra overhead.

Worker reuse - Workers threads can occupy memoery and

## ArrayBuffer Neutering

Be aware that when calling worker loaders, binary data is transferred from the calling thread to the worker thread. This means that if you are using `parse`, any `ArrayBuffer` parameter you pass in to the will be "neutered" and no longer be accessible in the calling thread.

Most applications will not need to do further processing on the raw binary data after it has been parsed so this is rarely an issue, but if you do, you may need to copy the data before parsing, or disable worker loading (see above).

## Specifying Worker Script URLs (Advanced)

In JavaScript, worker threads are loaded from separate scripts files and are typically not part of the main application bundle. For ease-of-use, loaders.gl provides a default set of pre-built worker threads which are published on loaders.gl npm distribution from `unpck.com` CDN (Content Delivery Network).

As an advanced option, it is possible to for application to specify alternate URLs for loading a pre-built worker loader instance.

This can be useful e.g. when building applications that cannot access CDNs or when creating highly customized application builds, or doing in-depth debugging.

## Composite Loaders and Workers (Advanced)

loaders.gl supports sub-loader invocation from worker loaders. This is somewhat experimental

A worker loader starts a seperate thread with a javascript bundle that only contains the code for that loader, so a worker loader needs to call the main thread (and indirectly, potentially another worker thread with another worrker loader) to parse using a sub-loader, properly transferring data into and back from the other thread.

## Debugging Worker Loaders (Advanced)

Debugging worker loaders is tricky. While it is always possible to specify `options.worker: false` which helps in many situations, there are cases where the worker loader itself must be debugged.

TBA - There is an ambition to provide better support for debugging worker loaders:

- Pre-build non-minified versions of workers, and provide option to easily select those.
- Let loaders.gl developers easily switch between CDN and locally built workers.
- ...
