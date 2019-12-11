# Worker Threads

On modern browsers, many loaders.gl loaders are set up to run on JavaScript worker threads. (Refer the documentation of each loader to see if it supports worker thread loading).

Loading and parsing of data on worker threads can bring significant advantages

- **Avoid blocking the browser main thread** - when parsing longer files, the main thread can become blocked, effectively "freezing" the application's user interface until parsing completes.
- **Parallel parsing on multi-core CPUs** - when parsing multiple files on machines that have multiple cores (essentially all machines, even modern mobile phones tend to have at least two cores), worker threads enables multiple files to be parsed in parallel which can dramatically reduce the total load times.

Hoever, there are a number of considerations when loading and parsing data on JavaScript worker threads:

- **Serialization/deserializion overhead** when transferring resuls back to main thread can more than defeat gains from loading on a separate thread.
- **Choice of Data Types** - Due to data transfer issues there are constraints on what data types are appropriate
- **Build configuration** - Workers can require complex build system setup/configuration.
- **Message Passing** - Parsing on workers requires message passing between threads. While simple it can add clutter to application code.
- **Debugging** - Worker based code tends to be harder to debug. Being able to easily switch back to main thread parsing (or an alternate worker build) can be very helpful.
- **Startup Times** - Worker startup times can defeat speed gains from parsing on workers.

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
