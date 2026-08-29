---
title: parse
description: Decode already-available data with a loader.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Core parsing API"
  title="Decode data you already have."
  description="Use `parse()` when the bytes, text, response, or stream are already in hand. It selects a loader, runs the parser, and returns the loader’s category data without treating a string as a URL."
  tone="cyan"
  meta={['Async API', 'Loaded data', 'Explicit or registered loaders']}
  links={[
    {label: 'Core module', to: '/docs/modules/core'},
    {label: 'Load a URL', to: '/docs/modules/core/api-reference/load'},
    {label: 'Parse in batches', to: '/docs/modules/core/api-reference/parse-in-batches'}
  ]}
/>

<DocOrientation
  eyebrow="The parse boundary"
  title="Receive data. Select a loader. Return category data."
  description="Parsing is the lower-level companion to `load()`: fetching is your responsibility, while loaders.gl handles selection, parser setup, worker execution, and the returned data shape."
  tone="cyan"
  items={[
    {label: 'Input', value: 'Response, bytes, text, File, Blob, or an iterator'},
    {label: 'Selection', value: 'Explicit loader or registered autodetection'},
    {label: 'Execution', value: 'Parser, worker, and loader-specific options'},
    {label: 'Output', value: 'The selected loader’s category data'}
  ]}
/>

This function "atomically" parses data (i.e. parses the entire data set in one operation). It can be called on "already loaded" data such as `ArrayBuffer` and `string` objects.

In contrast to `load`, `parse` does not accept URLs (it treats strings as data to be parsed) however it does read data from `Response` objects (which can involve loading data from a source). `Response` objects are returned by `fetch` but can also be manually created to wrap other data types, which makes `parse` quite flexible.

:::caution
When calling parse from a loader to invoke a sub-loader, do not use this function. Use the `parseWithContext` counterparts in `@loaders.gl/loader-utils``
:::

## Usage

The return value from `fetch` or `fetchFile` is a `Promise` that resolves to the fetch `Response` object and can be passed directly to the non-sync parser functions:

```typescript
import {fetchFile, parse} from '@loaders.gl/core';
import {OBJLoader} from '@loaders.gl/obj';

data = await parse(fetchFile(url), OBJLoader);
// Application code here
...
```

<ReferenceBoundary
  title="Parsing details"
  description="The reference below covers async parsing, batch parsing, errors, supported input types, and loader selection."
  tone="cyan"
/>

Batched (streaming) parsing is supported by some loaders

```typescript
import {fetchFile, parseInBatches} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/csv';

const batchIterator = await parseInBatches(fetchFile(url), CSVLoader);
for await (const batch of batchIterator) {
  console.log(batch.length);
}
```

Handling errors

```typescript
try {
  const response = await fetch(url); // fetch can throw in case of network errors
  const data = await parse(response); // parse will throw if server reports an error
} catch (error) {
  console.log(error);
}
```

## Functions

### parse(data: Response | ArrayBuffer | String, loaders: Object | Object\[], options?: Object) : Promise\<Any\>

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

- `loaders` - can be a single loader or an array of loaders. If single loader is provided, will force to use it. If ommitted, will use the list of pre-registered loaders (see `registerLoaders`)

- `data`: loaded data or an object that allows data to be loaded. See table below for valid input types for this parameter.
- `loaders` - can be a single loader or an array of loaders. If ommitted, will use the list of pre-registered loaders (see `registerLoaders`)
- `options`: See [`LoaderOptions`](./loader-options).
- `url`: optional, assists in the autoselection of a loader if multiple loaders are supplied to `loader`.

Returns:

- Return value depends on the _loader object_ category

Notes:

- If multiple `loaders` are provided (or pre-registered), an attempt will be made to autodetect which loader is appropriate for the file (using url extension and header matching).

| Data Type                                         | Description                                                                            | Comments                                               |
| ------------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `Response`                                        | `fetch` response object returned by e.g. `fetchFile` or `fetch`.                       | Data will be streamed from the `response.body` stream. |
| `ArrayBuffer`                                     | Parse from binary data in an array buffer                                              |                                                        |
| `String`                                          | Parse from text data in a string.                                                      | Only works for loaders that support textual input.     |
| converted into async iterators behind the scenes. |
| `File`                                            | A browser file object (from drag-and-drop or file selection operations).               |                                                        |
| `Promise`                                         | A promise that resolves to any of the other supported data types can also be supplied. |                                                        |

| `Iterator` | Iterator that yields binary (`ArrayBuffer`) chunks or string chunks | string chunks only work for loaders that support textual input. |
| `AsyncIterator` | iterator that yields promises that resolve to binary (`ArrayBuffer`) chunks or string chunks. |

Note that additional data types can be converted to `Response` objects and used with `parse`, e.g. with `new Response(new FormData(...))`. See browser documentation for the `Response` class for more details.
