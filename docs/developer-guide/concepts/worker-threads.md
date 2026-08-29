---
title: Worker threads
description: Move expensive parsing off the browser main thread while keeping data transfer explicit.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Parallel parsing"
  title="Keep the interface responsive while data is decoded."
  description="Worker-enabled loaders run parsing away from the browser main thread. The useful boundary is transferable binary data: less serialization means more of the worker’s time goes to parsing."
  tone="violet"
  meta={['Browser workers', 'Transferable buffers', 'Zero-config bundles']}
  links={[
    {label: 'Worker loaders', to: '/docs/developer-guide/using-worker-loaders'},
    {label: 'Binary data', to: '/docs/developer-guide/concepts/binary-data'}
  ]}
/>

<DocOrientation
  eyebrow="The performance boundary"
  title="Move computation, not a second copy of the dataset."
  description="Workers help when parsing is expensive and results can remain in transferable buffers. The same API can fall back to the main thread when debugging, startup cost, or object-heavy output matters more."
  tone="violet"
  items={[
    {label: 'Good fit', value: 'Large files and compute-heavy decoders'},
    {label: 'Data shape', value: 'ArrayBuffers, typed arrays, and Arrow'},
    {label: 'Trade-off', value: 'Startup, messaging, and serialization cost'},
    {label: 'Debugging', value: 'Switch to main-thread parsing when needed'}
  ]}
/>

On modern browsers, many loaders.gl loaders can run on JavaScript worker threads. See each loader's
documentation for its worker support and any required codec or asset configuration.

<ReferenceBoundary
  title="Worker data flow and trade-offs"
  description="The sections below cover transfer, data types, message passing, build configuration, bundle size, debugging, and benchmarking."
  tone="violet"
/>

Loading and parsing of data on worker threads can bring significant advantages

- **Avoid blocking the browser main thread** - when parsing longer files, the main thread can become blocked, effectively "freezing" the application's user interface until parsing completes.
- **Parallel parsing on multi-core CPUs** - when parsing multiple files on machines with multiple
  cores, worker threads enable files to be parsed in parallel and can reduce total load time.

However, there are a number of considerations when loading and parsing data on JavaScript worker threads:

- **Serialization/deserialization overhead** when transferring results back to the main thread can
  more than defeat the gains from loading on a separate thread.
- **Choice of data types** - Data transfer is cheapest for binary and transferable types.
- **Build configuration** - Workers can require complex build system setup/configuration.
- **Message passing** - Parsing on workers requires communication between threads. While loaders.gl
  handles it, messaging still has a cost.
- **Debugging** - Worker-based code can be harder to debug. Switching back to main-thread parsing is
  useful during development.
- **Startup times** - Worker startup time can outweigh the parsing savings for small inputs.

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
