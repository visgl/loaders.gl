# Worker Threads

Reasons for moving loading to workers:

- When parsing is CPU heavy, the browser main thread can become blocked, freezing the application until parsing completes.
- Leverage multi-core CPUs when parsing multiple data items.

Considerations when moving loading and parsing to workers:

- Data Transfer - Serializing/deserializing when transferring resuls back to main thread can more than defeat gains from loading on a separate thread.
- Data Types - Due to data transfer issues there are constraints on what data types are appropriate
- Configuration - Creating workers can require build system setup/configuration.
- Message Passing - Parsing on workers requires message passing between threads. While simple it can add clutter to application code.
- Debugging - Worker based code can be somewhat harder to debug. Being able to move the code back to the main thread can help.
- Startup Times - Worker startup times can defeat speed gains from parsing on workers.
- Thread Pool Management (TBA) -

## Data Transfer

Threads cannot share non-binary data structures and these have to be serialized/deserialized. This is a big issue for worker thread based loading as the purpose of loaders is typically to load and parse big datastructures, and main thread deserialization times are often comparable to or even exceed the time required to parse the data in the first place, defeating the value of moving parsing to a worker thread.

The solution is usually to use data types that support ownership transfer (see next section) as much as possible and minimize the amount of non-binary data returned from the parser.

## Data Types

JavaScript ArrayBuffers and Typed Arrays can be passed with minimal overhead (ownership transfer) and the value of worker based parsing usually depends on whether the loaded data can (mostly) be stored in these types.

## Message Passing

loaders.gl will handle message passing behind the scenes. Loading on a worker thread returns a promise that completes when the worker is done and the data has been transferred back to the main thread.

## Build Configuration

All worker enabled loaders come with a pre-built, minimal worker "executable" to enable zero-configuration use in applications.

## Bundle size concerns

All worker enabled loaders provide separate loader objects to ensure that tree-shaking bundlers will be able to remove the code for the unused case.

## Debugging and Benchmarking

Loaders.gl offers loader objects for main thread and worker threads. A simple switch lets you move your loading back to the main thread for easier debugging and benchmarking (comparing speeds to ensure you are gaining the benefits you expect from worker thread based loading).

## Startup Times (TBA)

Through Thread Pool Management it will be possible to start worker threads before they ae needed to minimize worker loading delay when parsing.

## Thread Pool Management (TBA)

It can be valuable to run muliple instances of the same worker thread to leverage multi-core CPUs. Being able to warm-up (pre-iniutilize) the thread pool and set limits of how many threads of each worker type...
