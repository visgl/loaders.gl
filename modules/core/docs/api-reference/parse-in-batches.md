# parseInBatches

The `parseInBatches` function can parse incrementally from a stream of data as it arrives and emit "batches" of parsed data.

Batched parsing is only supported by a subset of loaders. Check documentation of each loader before using this function.

From [![Website shields.io](https://img.shields.io/badge/v2.3-blue.svg?style=flat-square)](http://shields.io) `parseInBatches` can be used with all loaders. Non-supporting loaders will wait until all data has arrived, and emit a single batch containing the parsed data for the entire input (effectively behave as if `parse` had been called).

## Usage

Parse CSV in batches (emitting a batch of rows every time data arrives from the network):

```js
import {fetchFile, parseInBatches} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/obj';

const batchIterator = await parseInBatches(fetchFile(url), CSVLoader);
for await (const batch of batchIterator) {
  console.log(batch.length);
}
```

Parse CSV in batches, requesting an initial metadata batch:

```js
import {fetchFile, parseInBatches} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/obj';

const batchIterator = await parseInBatches(fetchFile(url), CSVLoader, {metadata: true});
for await (const batch of batchIterator) {
  switch (batch.batchType) {
    case 'metadata':
      console.log(batch.metadata);
      break;
    default:
      processBatch(batch.data);
  }
}
```

## Functions

### async parseInBatches(data: DataSource, loaders: object | object\[], options?: object): AsyncIterator

### async parseInBatches(data: DataSource, options?: object]]): AsyncIterator

Parses data in batches from a stream, releasing each batch to the application while the stream is still being read.

Parses data with the selected _loader object_. An array of `loaders` can be provided, in which case an attempt will be made to autodetect which loader is appropriate for the file (using url extension and header matching).

- `data`: loaded data or an object that allows data to be loaded. Plese refer to the table below for valid types.
- `loaders` - can be a single loader or an array of loaders. If ommitted, will use the list of registered loaders (see `registerLoaders`)
- `options`: optional, options for the loader (see documentation of the specific loader).
- `url`: optional, assists in the autoselection of a loader if multiple loaders are supplied to `loader`.

Returns:

- Returns an async iterator that yields batches of data. The exact format for the batches depends on the _loader object_ category.

Notes:

- The `loaders` parameter can also be ommitted, in which case any _loaders_ previously registered with [`registerLoaders`](docs/api-reference/core/register-loaders) will be used.

## Input Types

| Data Type                                          | Description                                                                                   | Comments                                                        |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `Response`                                         | `Response` object, e.g returned by `fetch` or `fetchFile`.                                    | Data will be streamed from the `response.body` stream.          |
| `AsyncIterator`                                    | iterator that yields promises that resolve to binary (`ArrayBuffer`) chunks or string chunks. |
| converted into async iterators behind the scenes.) |
| `Iterator`                                         | Iterator that yields binary chunks (`ArrayBuffer`) or string chunks                           | string chunks only work for loaders that support textual input. |
| `Promise`                                          | A promise that resolves to any of the other supported data types can also be supplied.        |

Note that many other data sources can also be parsed by first converting them to `Response` objects, e.g. with `fetchResoure`: http urls, data urls, `ArrayBuffer`, `String`, `File`, `Blob`, `ReadableStream` etc.

## Remarks

| Option                       | Type          | Default                    | Description                                                                                               |
| ---------------------------- | ------------- | -------------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `options.metadata`           | `boolean`     | `false`                    | An initial batch with `batchType: 'metadata'` will be added with information about the data being loaded. |
| `options.batches.chunkSize?` | `number`      | N/A                        | When set, "atomic" inputs (like `ArrayBuffer` or `string`) are chunked, enabling batched parsing.         | No effect if input is already an iterator or stream.                                                                                                  |
| `options.fetch`              | `object       | (url: string) => Response` | `{}`                                                                                                      | Specifies either an object with options to pass to `fetchFile`, or a function that is called in place of `fetchFile` to fetch data in any subloaders. |
| `options.transforms`         | `Transform[]` | `[]`                       | An array with transforms that can be applied to the input data before parsing.                            |
