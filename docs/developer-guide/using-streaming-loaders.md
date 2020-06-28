# Using Streaming Loaders

A major feature of loaders.gl is the availability of a number of streaming loaders.

The advantages and characteristics of streaming are descriped in more detail in the [streaming](./concepts/streaming.md) concepts section, but the highlights are:

- Ability to parse large data sources that exceed browser memory limits (maximum allocation limits for a single `string` or `ArrayBuffer` etc tends to be less tha 1GB in most browsers).
- While parsing is not done on a worker, it is broken into small pieces and does not freeze the main thread.,
- data can be process and displayed as it arrives over the network, rather than at the end of a long request, leading to a more interactive experience.

## Async Iterator based Streaming

The loaders.gl streaming architecture is built on ES2018 async iterators (rather than the "older" streams). Async iterators are easy to work with, are consistent across browsers and Node.js, and have built-in JavaScript language support such as `for await (... of ...)` and `async function *`.

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

`parseInBatches` is quite flexible.

While the primary input for `parseInBatches` is an async iterator that yields raw `ArrayBuffer` chunks (and it returns an async iterator that yields parsed batches of data), many other input types are also supported.

Any `Stream` can also be used as input to `parseInBatches`. An async iterator will automatically be created from the stream.

As is usually the case in loaders.gl, `Response` can also be used as input (loaders.gl uses the `Response.body` stream).

Note that while `Response` objects are normally returned from `fetch` calls, they can also be created directly by the application, and many data types can be trivially wrapped in `Response` objects (e.g. `FormData`, `Blob`, `File` etc), which makes it possible to do streaming loads from almost any data source.
