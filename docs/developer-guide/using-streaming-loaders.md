# Using Streaming Loaders

A major feature of loaders.gl is the availability of a number of streaming loaders.

The advantages and characteristics of streaming are descriped in more detail in the [streaming](./concepts/streaming.md) concepts section, but the highlights are:

- Ability to parse large data sources that exceed browser memory limits (maximum allocation limits for a single `string` or `ArrayBuffer` etc tends to be less tha 1GB in most browsers).
- While parsing is not done on a worker, it is broken into small pieces and does not freeze the main thread.,
- data can be process and displayed as it arrives over the network, rather than at the end of a long request, leading to a more interactive experience.

## Async Iterator based Streaming

The loaders.gl streaming architecture is built on ES2018 async iterators rather than `Stream`s. Async iterators are arguably easier to work with than streams, are consistent across browsers and Node.js, and enable a "callback-less" programming style through built-in JavaScript language features, i.e. `for await (... of ...)` and `async function *`.

Note: `Stream` input data is still accepted, but all processing is done via async iterators.

```js
import {JSONLoader} from '@loaders.gl/json';
import {load} from '@loaders.gl/core';

const data = await load(url, JSONLoader, {json: options});
```

The JSONLoader supports streaming JSON parsing, in which case it will yield "batches" of rows from the first array it encounters in the JSON. To e.g. parse a stream of GeoJSON:

```js
import {JSONLoader} from '@loaders.gl/json';
import {load} from '@loaders.gl/core';

const batches = await loadInBatches('geojson.json', JSONLoader);

for await (const batch of batches) {
  // batch.data will contain a number of rows
  for (const feature of batch.data) {
    switch (feature.geometry.type) {
      case 'Polygon':
      ...
    }
  }
}
```

## Streaming Data Sources

While the primary input for `parseInBatches` is an async iterator many input types are supported:

- `AsyncIterable<ArrayBuffer>` (i.e. the iterator must yield `ArrayBuffer` chunks).
- `Stream` instances can be used as input to `parseInBatches`. An async iterator will automatically be created from the stream.
- `Response` objects can also be used as input (the `Response.body` stream will be used).

In addition, note that applications can easily wrap many data types in a `Response` object (e.g. `FormData`, `Blob`, `File`, `string`, `ArrayBuffer` etc), which makes it possible to do streaming loads from almost any data source.
