# parse

This functions parse data. As important special cases, the async `parse` function can also load (and then parse) data from a `fetch` (or `fetchFile`) `Response` object, and the streaming `parseInBatches` version can parse incrementally from a stream as data arrives.

## Usage

The return value from `fetch` or `fetchFile` is a `Promise` that resolves to the fetch `Response` object and can be passed directly to the non-sync parser functions:

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

Handling errors

```js
try {
  const response = await fetch(url); // fetch can throw in case of network errors
  const data = await parse(response); // parse will throw if server reports an error
} catch (error) {
  console.log(error);
}
```

## Functions

### parse(data : ArrayBuffer | String, loaders : Object | Object\[] [, options : Object [, url : String]]) : Promise.Any

### parse(data : ArrayBuffer | String, [, options : Object [, url : String]]) : Promise.Any

Parses data asynchronously either using the provided loader or loaders, or using the pre-registered loaders (see `register-loaders`).

- `data`: loaded data or an object that allows data to be loaded. This parameter can be any of the following types:

  - `Response` - response object returned by `fetchFile` or `fetch`.
  - `ArrayBuffer` - Parse from binary data in an array buffer
  - `String` - Parse from text data in a string. (Only works for loaders that support textual input).
  - `Iterator` - Iterator that yeilds binary (`ArrayBuffer`) chunks or string chunks (string chunks only work for loaders that support textual input).
  - `AsyncIterator` - iterator that yeilds promises that resolve to binary (`ArrayBuffer`) chunks or string chunks.
  - `ReadableStream` - A DOM or Node stream.
  - `File` - A browser file object (from drag-and-drop or file selection operations).
  - `Promise` - A promise that resolves to any of the other supported data types can also be supplied.

- `loaders` - can be a single loader or an array of loaders. If ommitted, will use the list of pre-registered loaders (see `registerLoaders`)

- `options`: optional, options for the loader (see documentation of the specific loader).

- `url`: optional, assists in the autoselection of a loader if multiple loaders are supplied to `loader`.

Options:

- `options.log`=`console` Any object with methods `log`, `info`, `warn` and `error`. By default set to `console`. Setting log to `null` will turn off logging.

Returns:

- Return value depends on the _loader object_ category

Notes:

- If multiple `loaders` are provided (or pre-registered), an attempt will be made to autodetect which loader is appropriate for the file (using url extension and header matching).
