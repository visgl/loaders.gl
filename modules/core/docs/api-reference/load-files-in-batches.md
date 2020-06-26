# loadFilesInBatches

<p class="badges">
  <img src="https://img.shields.io/badge/From-v2.3-blue.svg?style=flat-square" alt="From-v2.3" />
</p>

`loadFilesInBatches` will load and parse multiple files from a list of files or urls. It scans the supplied files, looking for valid loader matches, and
- calls `parseInBatches` on each valid file/loader combination.
- ignores files that do not match a loader
- provides access to the supplied files to the loaders (multi-file loading).

## Usage

Parse CSV in batches (emitting a batch of rows every time data arrives from the network):

```js
import {fetchFile, parseFilesInBatches} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/obj';

const fileMap = await loadFilesInBatches([url1, url2, url3], CSVLoader, {metadata: true}));
for (const batchIterator of fileMap) {
  // `batchIterator` represents the the output of `parseInBatches` on one of the files
  for await (const batch of batchIterator) {
    switch (batch.batchType) {
      case 'metadata':
        console.log(batch.metadata);
        break;
      default:
        processBatch(batch.data);
    }
  }
}
```

## Functions

### async loadFilesInBatches(data: FileSource, loaders: object | object\[], options?: object): AsyncIterator[]

### async loadFilesInBatches(data: FileSource, options?: object]]): AsyncIterator[]

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

| Option                       | Type      | Default | Description                                                                                               |
| ---------------------------- | --------- | ------- | --------------------------------------------------------------------------------------------------------- |
| `options.metadata`           | `boolean` | `false` | An initial batch with `batchType: 'metadata'` will be added with information about the data being loaded. |
| `options.batches.chunkSize?` | `number`  | N/A     | When set, "atomic" inputs (like `ArrayBuffer` or `string`) are chunked, enabling batched parsing.         | No effect if input is already an iterator or stream. |
