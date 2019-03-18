# parseFile

## Usage

The return value from `fetch` or `fetchFile` is a `Promise` that resolves to the fetch response object and can be passed directly to the (non-sync) parser functions:

```js
import {fetchFile, parseFile} from '@loaders.gl/core';
import {OBJLoader} from '@loaders.gl/obj';

data = await parseFile(fetchFile(url), OBJLoader);
// Application code here
...
```

## Functions

### parseFileInBatches(data : any, loader : Object | Array [, options : Object [, url : String]]) : AsyncIterator

- `data`: loaded data or an object that allows data to be loaded. This parameter can be any of the following types:
  - `Response` - `fetch` response object returned by `fetchFile` or `fetch`.
  - `ArrayBuffer` - Parse from binary data in an array buffer
  - `String` - Parse from text data in a string. (Only works for loaders that support textual input).
  - `Iterator` - Iterator that yeilds binary (`ArrayBuffer`) chunks or string chunks (string chunks only work for loaders that support textual input).
  - `AsyncIterator` - iterator that yeilds promises that resolve to binary (`ArrayBuffer`) chunks or string chunks.
  - `ReadableStream` - A DOM or Node stream.
  - `Promise` - A promise that resolves to any of the other supported data types can also be supplied.
- `loader` - can be a single loader or an array of loaders.
- `options` - optional, options for the loader (see documentation of the specific loader).
- `url` - optional, assists in the autoselection of a loader if multiple loaders are supplied to `loader`.

### parseFile(data : ArrayBuffer | String, loader : Object | Array [, options : Object [, url : String]]) : Promise<Any>

Parses data asynchronously using the provided loader.

- `data`: loaded data or an object that allows data to be loaded. This parameter can be any of the following types:
  - `Response` - `fetch` response object returned by `fetchFile` or `fetch`.
  - `ArrayBuffer` - Parse from binary data in an array buffer
  - `String` - Parse from text data in a string. (Only works for loaders that support textual input).
  - `Iterator` - Iterator that yeilds binary (`ArrayBuffer`) chunks or string chunks (string chunks only work for loaders that support textual input).
  - `AsyncIterator` - iterator that yeilds promises that resolve to binary (`ArrayBuffer`) chunks or string chunks.
  - `ReadableStream` - A DOM or Node stream.
  - `Promise` - A promise that resolves to any of the other supported data types can also be supplied.
- `loader` - can be a single loader or an array of loaders.
- `options` - optional, options for the loader (see documentation of the specific loader).
- `url` - optional, assists in the autoselection of a loader if multiple loaders are supplied to `loader`.

- `options.log`=`console` Any object with methods `log`, `info`, `warn` and `error`. By default set to `console`. Setting log to `null` will turn off logging.

### parseFileSync(fileData : ArrayBuffer | String, loader : Object | Array, [, options : Object [, url : String]]) : any

Parses data synchronously using the provided loader, if possible. If not, returns `null`, in which case asynchronous loading is required.

- `data` - already loaded data, either in binary or text format. This parameter can be any of the following types: - `Response` - `fetch` response object returned by `fetchFile` or `fetch`. - `ArrayBuffer` - Parse from binary data in an array buffer - `String` - Parse from text data in a string. (Only works for loaders that support textual input). - `Iterator` - Iterator that yeilds binary (`ArrayBuffer`) chunks or string chunks (string chunks only work for loaders that support textual input).
  can also be supplied.
- `loader` - can be a single loader or an array of loaders.
- `options` - optional, options for the loader (see documentation of the specific loader).
- `url` - optional, assists in the autoselection of a loader if multiple loaders are supplied to `loader`.
