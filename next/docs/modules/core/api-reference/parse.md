Core parsing API

# Decode data you already have.

Use `parse()` when the bytes, text, response, or stream are already in hand. It selects a loader, runs the parser, and returns the loader’s category data without treating a string as a URL.

[Core module](https://loaders.gl/next/docs/modules/core.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core.md)[Load a URL](https://loaders.gl/next/docs/modules/core/api-reference/load.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core/api-reference/load.md)[Parse in batches](https://loaders.gl/next/docs/modules/core/api-reference/parse-in-batches.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core/api-reference/parse-in-batches.md)

The parse boundary

## Receive data. Select a loader. Return category data.

Parsing is the lower-level companion to \`load()\`: fetching is your responsibility, while loaders.gl handles selection, parser setup, worker execution, and the returned data shape.

01

Input

Response, bytes, text, File, Blob, or an iterator

02

Selection

Explicit loader or registered autodetection

03

Execution

Parser, worker, and loader-specific options

04

Output

The selected loader’s category data

This function parses data atomically, meaning that the complete result is returned in one operation. It is intended for already available data such as `ArrayBuffer` and `string` objects.

In contrast to `load()`, `parse()` does not interpret strings as URLs. It does read data from `Response` objects, which can involve consuming a response body stream.

caution

When calling a sub-loader from inside a loader, do not use this public function. Use the `parseFromContext` counterparts in `@loaders.gl/core/loader-utils`.

## Usage[​](#usage "Direct link to Usage")

The return value from `fetch` or `fetchFile` is a `Promise` that resolves to the fetch `Response` object and can be passed directly to the non-sync parser functions:

```
import {fetchFile, parse} from '@loaders.gl/core';

import {OBJLoader} from '@loaders.gl/scene/obj';



const data = await parse(fetchFile(url), OBJLoader);

// Application code here

...
```

For worker-enabled loaders, atomic `parse()` uses the worker by default when the runtime supports it. Use `core.worker: false` to keep the work on the calling thread, or opt into loader-provided cost estimates with `core.worker: 'auto'` and `core.workerThreshold` when small inputs should avoid worker startup and transfer overhead. See [Using worker loaders](https://loaders.gl/next/docs/developer-guide/using-worker-loaders.md) for worker availability, transfer ownership, and fallback behavior.

Detailed guide

## Parsing details

The reference below covers async parsing, batch parsing, errors, supported input types, and loader selection.

Some loaders also support batched (streaming) parsing:

```
import {fetchFile, parseInBatches} from '@loaders.gl/core';

import {CSVLoader} from '@loaders.gl/tables/csv';



const batchIterator = await parseInBatches(fetchFile(url), CSVLoader);

for await (const batch of batchIterator) {

  console.log(batch.length);

}
```

Errors

```
try {

  const response = await fetch(url); // fetch can throw in case of network errors

  const data = await parse(response); // parse will throw if server reports an error

} catch (error) {

  console.log(error);

}
```

## Functions[​](#functions "Direct link to Functions")

### parse(data, loaders?, options?)[​](#parsedata-loaders-options "Direct link to parse(data, loaders?, options?)")

Parses data asynchronously using the provided loader or loaders, or using the pre-registered loaders (see [`registerLoaders`](https://loaders.gl/next/docs/modules/core/api-reference/register-loaders.md)).

| Input                                    | Description                                                                              |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| `Response`                               | A response returned by `fetch()` or `fetchFile()`; its body can be consumed as a stream. |
| `ArrayBuffer`, `Uint8Array`, or `string` | Already loaded binary or textual data. Strings are treated as data, not URLs.            |
| `File` or `Blob`                         | Browser file data.                                                                       |
| `Iterator` or `AsyncIterator`            | Binary or textual chunks for loaders that support streaming input.                       |
| `ReadableStream`                         | A DOM or Node stream.                                                                    |
| `Promise`                                | A promise resolving to any supported input type.                                         |

`loaders` can be a single loader, an array of candidates, or omitted when loaders have been registered. `options` uses [`LoaderOptions`](https://loaders.gl/next/docs/modules/core/api-reference/loader-options.md), including an optional `url` hint for loader selection. The return value depends on the selected loader's category data.

Note that additional data types can be converted to `Response` objects and used with `parse`, e.g. with `new Response(new FormData(...))`. See browser documentation for the `Response` class for more details.
