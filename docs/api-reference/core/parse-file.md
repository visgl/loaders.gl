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

### parseFileInBatches(file : any, loader : Object | Array [, options : Object [, url : String]]) : AsyncIterator

A

- `file`: This parameter can be any of the following types, or a `Promise` that resolves into one of these types.
  - `Response` - i.e. a `fetch` response object returned by `fetchFile` or `fetch`.
  - `ArrayBuffer` -
  - `Iterator` -
  - `AsyncIterator` -
  - `ReadableStream` -
  - `Promise` - A promise will be resolved and if result

Notes:

### parseFile(fileData : ArrayBuffer | String, loader : Object | Array [, options : Object [, url : String]]) : Promise<Any>

Parses data asynchronously using the provided loader.

- `data` - loaded data, either in binary or text format.
- `loader` - can be a single loader or an array of loaders.
- `options` - optional, options for the loader (see documentation of the specific loader).
- `url` - optional, assists in the autoselection of a loader if multiple loaders are supplied to `loader`.

- `options.log`=`console` Any object with methods `log`, `info`, `warn` and `error`. By default set to `console`. Setting log to `null` will turn off logging.

### parseFileSync(fileData : ArrayBuffer | String, loader : Object | Array, [, options : Object [, url : String]]) : any

Parses data synchronously using the provided loader, if possible. If not, returns `null`, in which case asynchronous loading is required.

- `data` - loaded data, either in binary or text format.
- `loader` - can be a single loader or an array of loaders.
- `options` - optional, options for the loader (see documentation of the specific loader).
- `url` - optional, assists in the autoselection of a loader if multiple loaders are supplied to `loader`.
