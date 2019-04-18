# parse

This function parses already loaded data. As a special case, it can also load (and then parse) data from a `fetch` or `fetchFile` response object).

## Usage

The return value from `fetch` or `fetchFile` is a `Promise` that resolves to the fetch response object and can be passed directly to the non-sync parser functions:

```js
import {fetchFile, parse} from '@loaders.gl/core';
import {OBJLoader} from '@loaders.gl/obj';

data = await parse(fetchFile(url), OBJLoader);
// Application code here
...
```

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

### parse(data : ArrayBuffer | String, loaders : Object | Object\[] [, options : Object [, url : String]]) : Promise<Any>

### parse(data : ArrayBuffer | String, [, options : Object [, url : String]]) : Promise<Any>

Parses data asynchronously using the provided loader.
Used to parse data with a selected _loader object_. An array of `loaders` can be provided, in which case an attempt will be made to autodetect which loader is appropriate for the file (using url extension and header matching).

The `loaders` parameter can also be ommitted, in which case any _loader objects_ previously registered with [`registerLoaders`](docs/api-reference/core/register-loaders) will be used.

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

- `options.log`=`console` Any object with methods `log`, `info`, `warn` and `error`. By default set to `console`. Setting log to `null` will turn off logging.

Returns:

- Return value depends on the _loader object_ category

### parseSync(fileData : ArrayBuffer | String, loaders : Object | Object\[], [, options : Object [, url : String]]) : any

### parseSync(fileData : ArrayBuffer | String, [, options : Object [, url : String]]) : any

> Synchronous parsing is not supported by all _loader objects_

Parses data synchronously using the provided loader, if possible. If not, returns `null`, in which case asynchronous parsing is required.

- `data`: already loaded data, either in binary or text format. This parameter can be any of the following types:
  - `Response`: `fetch` response object returned by `fetchFile` or `fetch`.
  - `ArrayBuffer`: Parse from binary data in an array buffer
  - `String`: Parse from text data in a string. (Only works for loaders that support textual input).
  - `Iterator`: Iterator that yeilds binary (`ArrayBuffer`) chunks or string chunks (string chunks only work for loaders that support textual input).
    can also be supplied.
- `loaders` - can be a single loader or an array of loaders. If ommitted, will use the list of registered loaders (see `registerLoaders`)
- `options`: optional, options for the loader (see documentation of the specific loader).
- `url`: optional, assists in the autoselection of a loader if multiple loaders are supplied to `loader`.

Returns:

- Return value depends on the _loader object_ category

### parseInBatches(data : any, loaders : Object | Object\[] [, options : Object [, url : String]]) : AsyncIterator

### parseInBatches(data : any [, options : Object [, url : String]]) : AsyncIterator

> Batched loading is not supported by all _loader objects_

Parses data in batches from a stream, releasing each batch to the application while the stream is still being read.

Parses data with the selected _loader object_. An array of `loaders` can be provided, in which case an attempt will be made to autodetect which loader is appropriate for the file (using url extension and header matching).

The `loaders` parameter can also be ommitted, in which case any _loader objects_ previously registered with [`registerLoaders`](docs/api-reference/core/register-loaders) will be used.

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
