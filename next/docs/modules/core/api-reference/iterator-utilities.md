Core module · streaming API

# Iterator utilities

Use one async-iteration model for readable and writable streams in browser and Node.js code.

[Core module](https://loaders.gl/next/docs/modules/core.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core.md)[Parse in batches](https://loaders.gl/next/docs/modules/core/api-reference/parse-in-batches.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core/api-reference/parse-in-batches.md)[Worker processing](https://loaders.gl/next/docs/modules/core/worker-utils/api-reference/worker-processing.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core/worker-utils/api-reference/worker-processing.md)

The stream boundary

## Treat arriving data as an async sequence.

The iterator helper lets loaders and application code consume or produce chunks without depending on the stream implementation underneath.

01

Readable

Iterate chunks from a stream

02

Writable

Write chunks through an async iterator

03

Runtime

Works in browsers and Node.js

04

Use

Streaming loaders, writers, and transforms

Detailed guide

## Iterator utility reference

The section below documents the stream-to-iterator helper.

## Functions[​](#functions "Direct link to Functions")

The public core helpers are `makeIterator` and `makeStream`:

```
import {makeIterator, makeStream} from '@loaders.gl/core';



const iterator = makeIterator(response);

for await (const chunk of iterator) {

  processChunk(chunk);

}
```

`makeIterator` adapts loaded data, responses, blobs, and supported readable streams to a chunk iterator. `makeStream` wraps an iterator in a readable stream. These helpers read data; they do not turn a writable stream into a readable iterator.
