## Using Worker Loaders

This section gives an overview of how to use worker loaders in loaders.gl. For more details on the advantages and complications with worker thread based loading the [Worker Threads](./using-worker-loaders.md) article in the concepts secion.

Many loaders.gl loader modules provide _worker loaders_, e.g. `DracoLoader`. This means that the loader have the ability to (optionally) execute on a worker thread, so that the main thread will not block during parsing. Worker loaders can also be run in parallel (up to limits rougly defined by the number of cores the CPU on your machine), potentially increasing parsing throughput on multicore CPUs.

Worker loaders are enabled by default for supporting loaders. E.g. to load two Draco encoded meshes in parallel on worker threads, just call the `DracoLoader` as follows:

```js
import {load} from '@loaders.gl/core';
import {DracoLoader} from '@loaders.gl/draco';

async function loadInParallel(url1, url2) {
  const [data1, data2] = await Promise.all([
    load(url1, DracoLoader),
    load(url2, DracoLoader)
  ]);
}
```

## Disabling Worker Loaders

Applications can use the `worker: false` option to disable worker loaders, for instance to simplify debugging of parsing issues:

```js
async function loadwWithoutWorker(url1) {
  const data = await load(url1, DracoLoader, {worker: false});
}
```

## Concurrency Level

Concurrency - The `options.maxConcurrency` parameter can be adjusted to define how many workers should be created for each format. Note that setting this higher than the number CPU cores will not provide much benefit.

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

