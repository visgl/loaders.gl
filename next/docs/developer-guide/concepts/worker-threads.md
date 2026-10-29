Parallel parsing

# Keep the interface responsive while data is decoded.

Worker-enabled loaders run parsing away from the browser main thread. The useful boundary is transferable binary data: less serialization means more of the worker’s time goes to parsing.

[Worker loaders](https://loaders.gl/next/docs/developer-guide/using-worker-loaders.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/using-worker-loaders.md)[Binary data](https://loaders.gl/next/docs/developer-guide/concepts/binary-data.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/concepts/binary-data.md)

The performance boundary

## Move computation, not a second copy of the dataset.

Workers help when parsing is expensive and results can remain in transferable buffers. The same API can fall back to the main thread when debugging, startup cost, or object-heavy output matters more.

01

Good fit

Large files and compute-heavy decoders

02

Data shape

ArrayBuffers, typed arrays, and Arrow

03

Trade-off

Startup, messaging, and serialization cost

04

Debugging

Switch to main-thread parsing when needed

On modern browsers, many loaders.gl loaders can run on JavaScript worker threads. See each loader's documentation for its worker support and any required codec or asset configuration.

Detailed guide

## Worker data flow and trade-offs

The sections below cover transfer, data types, message passing, build configuration, bundle size, debugging, and benchmarking.

Loading and parsing of data on worker threads can bring significant advantages

* **Avoid blocking the browser main thread** - when parsing longer files, the main thread can become blocked, effectively "freezing" the application's user interface until parsing completes.
* **Parallel parsing on multi-core CPUs** - when parsing multiple files on machines with multiple cores, worker threads enable files to be parsed in parallel and can reduce total load time.

However, there are a number of considerations when loading and parsing data on JavaScript worker threads:

* **Serialization/deserialization overhead** when transferring results back to the main thread can more than defeat the gains from loading on a separate thread.
* **Choice of data types** - Data transfer is cheapest for binary and transferable types.
* **Build configuration** - Workers can require complex build system setup/configuration.
* **Message passing** - Parsing on workers requires communication between threads. While loaders.gl handles it, messaging still has a cost.
* **Debugging** - Worker-based code can be harder to debug. Switching back to main-thread parsing is useful during development.
* **Startup times** - Worker startup time can outweigh the parsing savings for small inputs.

## Data Transfer[​](#data-transfer "Direct link to Data Transfer")

Threads cannot share non-binary data structures and these have to be serialized/deserialized. This is a big issue for worker thread based loading as the purpose of loaders is typically to load and parse big datastructures, and main thread deserialization times are often comparable to or even exceed the time required to parse the data in the first place, defeating the value of moving parsing to a worker thread.

The solution is usually to use data types that support ownership transfer (see next section) as much as possible and minimize the amount of non-binary data returned from the parser.

## Data Types[​](#data-types "Direct link to Data Types")

JavaScript ArrayBuffers and Typed Arrays can be passed with minimal overhead (ownership transfer) and the value of worker based parsing usually depends on whether the loaded data can (mostly) be stored in these types.

## Message Passing[​](#message-passing "Direct link to Message Passing")

loaders.gl will handle message passing behind the scenes. Loading on a worker thread returns a promise that completes when the worker is done and the data has been transferred back to the main thread.

## Build Configuration[​](#build-configuration "Direct link to Build Configuration")

Worker-enabled loaders remain zero-configuration: each loader can provide a pre-built classic worker bundle for explicit URLs and compatibility. In loaders.gl 5.0, loaders may also provide a bundler-resolved ES module worker using a static `new Worker(new URL(...), {type: 'module'})` factory. Compatible bundlers include that worker in the application build; if the factory is not available or cannot construct a worker, loaders.gl falls back to the classic bundle. See [Module and classic workers](https://loaders.gl/next/docs/developer-guide/using-worker-loaders.md#module-and-classic-workers) for precedence and URL details. In Node.js, worker threads use the loader's platform-specific entry and must be enabled explicitly with `core._nodeWorkers`.

## Bundle size concerns[​](#bundle-size-concerns "Direct link to Bundle size concerns")

Worker-enabled loaders provide separate worker entry points so tree-shaking bundlers can remove unused format code. A module-worker factory is statically discoverable by bundlers, while an explicit `workerUrl` keeps the worker outside the application bundle. Pre-built classic workers are useful for CDN, self-hosted, and older build setups.

## Debugging and Benchmarking[​](#debugging-and-benchmarking "Direct link to Debugging and Benchmarking")

Loaders.gl offers loader objects for main thread and worker threads. A simple switch lets you move your loading back to the main thread for easier debugging and benchmarking (comparing speeds to ensure you are gaining the benefits you expect from worker thread based loading).
