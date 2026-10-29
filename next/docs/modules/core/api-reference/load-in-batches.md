Core streaming API

# Start processing while the resource is still arriving.

`loadInBatches()` connects fetching to `parseInBatches()`, releasing metadata and data batches through an async iterator instead of waiting for the complete resource.

[Core module](https://loaders.gl/next/docs/modules/core.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core.md)[Streaming loaders](https://loaders.gl/next/docs/developer-guide/using-streaming-loaders.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/using-streaming-loaders.md)

The batch path

## Fetch, decode, yield, continue.

Batch boundaries depend on the selected loader. They may carry metadata, schemas, record batches, tiles, or other category-specific values while the source remains open.

01

Input

One resource or a coordinated list of files

02

Selection

Explicit loaders or registered autodetection

03

Yield

Metadata and data through an async iterator

04

Control

Loader options, file matching, and cancellation

```
type BatchInput = string | File | Blob | Response;



loadInBatches(

  files: BatchInput,

  loaders?: Loader | Loader[],

  options?: LoaderOptions

): Promise<AsyncIterable<unknown>>

loadInBatches(

  files: BatchInput[] | FileList,

  loaders?: Loader | Loader[],

  options?: LoaderOptions

): Promise<AsyncIterable<unknown>>[]
```

`loadInBatches()` fetches each URL and passes its response to `parseInBatches()`. For local files, blobs, responses, and iterables it forwards the input directly to the parser.

Detailed guide

## Batch loading details

The sections below cover single and multiple resources, loader matching, iterator results, options, and multi-file loader behavior.

`loadInBatches()` can also open multiple files from a list of `File` objects or URLs.

In this mode, it returns one promise for each file. Each promise resolves to an async batch iterator, allowing independent files to begin loading without waiting for the other files.

Each file is loaded independently. For formats with companion files, such as Shapefile, use the format-specific options and URL conventions rather than treating a file list as one dataset.

### Usage[​](#usage "Direct link to Usage")

```
const iteratorPromises = loadInBatches([file1, file2], OBJLoader);

const iterators = await Promise.all(iteratorPromises);

for (const iterator of iterators) {

  for await (const batch of iterator) {

    processMeshBatch(batch.data);

  }

}
```

```
import {loadInBatches} from '@loaders.gl/core';

import {CSVLoader} from '@loaders.gl/tables/csv';



const iteratorPromises = loadInBatches(['first.csv', 'second.csv'], CSVLoader);

for (const iterator of await Promise.all(iteratorPromises)) {

  for await (const batch of iterator) {

    processBatch(batch);

  }

}
```

`loadInBatches()` releases each batch to the application while the resource is still being read.

Parses data with the selected *loader object*. An array of `loaders` can be provided, in which case an attempt will be made to autodetect which loader is appropriate for the file (using the URL extension and header matching).

* `files`: loaded data or an object that allows data to be loaded. See the table below for valid types.
* `loaders`: can be a single loader or an array of loaders. If omitted, the list of registered loaders is used (see `registerLoaders`).
* `options`: see [`LoaderOptions`](https://loaders.gl/next/docs/modules/core/api-reference/loader-options.md).

Returns an async iterator that yields loader-defined batches. With multiple files, the function returns an array of promises, one for each input file.

The `loaders` parameter can be omitted when loaders have been registered with [`registerLoaders`](https://loaders.gl/next/docs/modules/core/api-reference/register-loaders.md).

## Options[​](#options "Direct link to Options")

The options object can contain:

* options specific to `loadInBatches`, see below.
* options defined by the `parseInBatches` and `parse` functions can be specified.
* options specific to any loaders can also be specified (in loader specific sub-objects).

Please refer to the corresponding documentation page for `parse` and to each loader for details.

| Option                       | Type      | Default | Description                                           |
| ---------------------------- | --------- | ------- | ----------------------------------------------------- |
| `options.ignoreUnknownFiles` | `boolean` | `true`  | Ignores unknown files if multiple files are provided. |
