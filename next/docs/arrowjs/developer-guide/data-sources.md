Arrow JavaScript · I/O boundaries

# Feed Arrow from the source you already have.

Arrow JS accepts browser and Node.js data sources through a small set of interoperable boundaries. Choose a stream, response, buffer, or async iterator without changing the table model downstream.

[Arrow JS guide](https://loaders.gl/next/docs/arrowjs.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs.md)[Reading and writing](https://loaders.gl/next/docs/arrowjs/developer-guide/reading-and-writing.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs/developer-guide/reading-and-writing.md)[Async iterators](https://loaders.gl/next/docs/developer-guide/concepts/async-iterators.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/concepts/async-iterators.md)

Pick the boundary

## Streams in, batches through, streams out.

Use the source form that matches your runtime. The same async-iterator model makes browser responses, Node streams, and in-memory chunks composable.

01

Streams

DOM and Node readable streams

02

Responses

Fetch promises and response bodies

03

Buffers

Uint8Array and ArrayBuffer inputs

04

Iterators

General pull-based sources and sinks

Detailed guide

## Data source details

The sections below cover streams, fetch responses, ArrayBuffers, async iterators, and the corresponding writer boundaries.

# Data Sources and Sinks

The Arrow JavaScript API is designed to make it easy to work with data sources both in the browser and in Node.js.

## Streams[​](#streams "Direct link to Streams")

Both Node and DOM/WhatWG Streams can be used directly as input sources by the Arrow JS API.

## Fetch Responses[​](#fetch-responses "Direct link to Fetch Responses")

Fetch responses (Promises) can be used where a data source is expected.

## ArrayBuffers[​](#arraybuffers "Direct link to ArrayBuffers")

Most data sources accept `Uint8Arrays`.

## AsyncIterators[​](#asynciterators "Direct link to AsyncIterators")

Async iterators are the most general way to abstract "streaming" data sources and data sinks and are consistently accepted (and in many cased returned) by the Arrow JS API.
