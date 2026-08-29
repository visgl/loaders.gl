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

This function parses data atomically, meaning that the complete result is returned in one
operation. It is intended for already available data such as `ArrayBuffer` and `string` objects.

In contrast to `load()`, `parse()` does not interpret strings as URLs. It does read data from
`Response` objects, which can involve consuming a response body stream.

:::caution
When calling a sub-loader from inside a loader, do not use this public function. Use the
`parseWithContext` counterparts in `@loaders.gl/loader-utils`.
:::

## Usage

The return value from `fetch` or `fetchFile` is a `Promise` that resolves to the fetch `Response` object and can be passed directly to the non-sync parser functions:

```typescript
import {fetchFile, parse} from '@loaders.gl/core';
import {OBJLoader} from '@loaders.gl/obj';

const data = await parse(fetchFile(url), OBJLoader);
// Application code here
...
```

<ReferenceBoundary
  title="Parsing details"
  description="The reference below covers async parsing, batch parsing, errors, supported input types, and loader selection."
  tone="cyan"
/>

Some loaders also support batched (streaming) parsing:

```typescript
import {fetchFile, parseInBatches} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/csv';

const batchIterator = await parseInBatches(fetchFile(url), CSVLoader);
for await (const batch of batchIterator) {
  console.log(batch.length);
}
```

Errors

```typescript
try {
  const response = await fetch(url); // fetch can throw in case of network errors
  const data = await parse(response); // parse will throw if server reports an error
} catch (error) {
  console.log(error);
}
```

## Functions

### parse(data, loaders?, options?)

Parses data asynchronously using the provided loader or loaders, or using the pre-registered loaders
(see [`registerLoaders`](./register-loaders)).

| Input | Description |
| --- | --- |
| `Response` | A response returned by `fetch()` or `fetchFile()`; its body can be consumed as a stream. |
| `ArrayBuffer`, `Uint8Array`, or `string` | Already loaded binary or textual data. Strings are treated as data, not URLs. |
| `File` or `Blob` | Browser file data. |
| `Iterator` or `AsyncIterator` | Binary or textual chunks for loaders that support streaming input. |
| `ReadableStream` | A DOM or Node stream. |
| `Promise` | A promise resolving to any supported input type. |

`loaders` can be a single loader, an array of candidates, or omitted when loaders have been
registered. `options` uses [`LoaderOptions`](./loader-options), including an optional `url` hint
for loader selection. The return value depends on the selected loader's category data.

Note that additional data types can be converted to `Response` objects and used with `parse`, e.g. with `new Response(new FormData(...))`. See browser documentation for the `Response` class for more details.
