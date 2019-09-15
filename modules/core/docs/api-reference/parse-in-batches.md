# parseInBatches

> Streaming parsing is not supported by all loaders. Refer to the documentation for each loader.

For supporting loaders, the streaming `parseInBatches` function can parse incrementally from a stream as data arrives and emit "batches" of parsed data.

Batched (streaming) parsing is supported by some loaders

```js
import {fetchFile, parseInBatches} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/obj';

const batchIterator = await parseInBatches(fetchFile(url), CSVLoader);
for await (const batch of batchIterator) {
  console.log(batch.length);
}
```

## Functions

### parseInBatches(data : any, loaders : Object | Object\[] [, options : Object [, url : String]]) : AsyncIterator

### parseInBatches(data : any [, options : Object [, url : String]]) : AsyncIterator

Parses data in batches from a stream, releasing each batch to the application while the stream is still being read.

Parses data with the selected _loader object_. An array of `loaders` can be provided, in which case an attempt will be made to autodetect which loader is appropriate for the file (using url extension and header matching).

The `loaders` parameter can also be ommitted, in which case any _loaders_ previously registered with [`registerLoaders`](docs/api-reference/core/register-loaders) will be used.

- `data`: loaded data or an object that allows data to be loaded. This parameter can be any of the following types:
  - `Response` - `fetch` response object returned by `fetchFile` or `fetch`.
  - `ArrayBuffer` - Parse from binary data in an array buffer
  - `String` - Parse from text data in a string. (Only works for loaders that support textual input).
  - `Iterator` - Iterator that yeilds binary (`ArrayBuffer`) chunks or string chunks (string chunks only work for loaders that support textual input).
  - `AsyncIterator` - iterator that yeilds promises that resolve to binary (`ArrayBuffer`) chunks or string chunks.
  - `ReadableStream` - A DOM or Node stream.
  - `Promise` - A promise that resolves to any of the other supported data types can also be supplied.
- `loaders` - can be a single loader or an array of loaders. If ommitted, will use the list of registered loaders (see `registerLoaders`)
- `options`: optional, options for the loader (see documentation of the specific loader).
- `url`: optional, assists in the autoselection of a loader if multiple loaders are supplied to `loader`.

Returns:

- Returns an async iterator that yields batches of data. The exact format for the batches depends on the _loader object_ category.
