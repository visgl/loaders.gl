---
title: parseInBatches
description: Decode a stream incrementally into loader-defined batches.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Core streaming API"
  title="Decode a stream one batch at a time."
  description="Use `parseInBatches()` when the input can arrive incrementally and the application can start work before the complete resource is available. The async iterator yields metadata and data in the shape defined by the loader."
  tone="violet"
  meta={['Async iterator', 'Incremental parsing', 'Metadata and data batches']}
  links={[
    {label: 'Core module', to: '/docs/modules/core'},
    {label: 'Load in batches', to: '/docs/modules/core/api-reference/load-in-batches'},
    {label: 'Streaming guide', to: '/docs/developer-guide/using-streaming-loaders'}
  ]}
/>

<DocOrientation
  eyebrow="The batch boundary"
  title="Read, yield, process, continue."
  description="A batch is not always a row array. Depending on the loader it may contain metadata, a schema, table rows, geometry, or another category-specific result."
  tone="violet"
  items={[
    {label: 'Input', value: 'Response, stream, iterator, or supported loaded data'},
    {label: 'Selection', value: 'Explicit loader or registered autodetection'},
    {label: 'Yield', value: 'Metadata and data through an async iterator'},
    {label: 'Control', value: 'Loader options, backpressure, and cancellation'}
  ]}
/>

The `parseInBatches` function can parse incrementally from a stream of data as it arrives and emit "batches" of parsed data.

Batched parsing is only supported by a subset of loaders. Check documentation of each loader before using this function.

From [![Website shields.io](https://img.shields.io/badge/v2.3-blue.svg?style=flat-square)](http://shields.io) `parseInBatches` can be used with all loaders. Non-supporting loaders will wait until all data has arrived, and emit a single batch containing the parsed data for the entire input (effectively behave as if `parse` had been called).

:::caution
When calling parse from a loader to invoke a sub-loader, do not use this function. Use the `parseInBatchesWithContext` counterparts in `@loaders.gl/loader-utils``
:::

## Usage

<ReferenceBoundary
  title="Batch parsing details"
  description="The reference below covers batch-compatible loaders, metadata batches, input types, loader selection, and options."
  tone="violet"
/>

Parse CSV in batches (emitting a batch of rows every time data arrives from the network):

```typescript
import {fetchFile, parseInBatches} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/csv';

const batchIterator = await parseInBatches(fetchFile(url), CSVLoader);
for await (const batch of batchIterator) {
  console.log(batch.length);
}
```

Parse CSV in batches, requesting an initial metadata batch:

```typescript
import {fetchFile, parseInBatches} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/csv';

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

### async parseInBatches(data: DataSource, loaders: object | object[], options?: object): AsyncIterator

### async parseInBatches(data: DataSource, options?: object): AsyncIterator

Parses data in batches from a stream, releasing each batch to the application while the stream is still being read.

Parses data with the selected _loader object_. An array of `loaders` can be provided, in which case an attempt will be made to autodetect which loader is appropriate for the file (using the URL extension and header matching).

- `data`: loaded data or an object that allows data to be loaded. See the table below for valid types.
- `loaders` can be a single loader or an array of loaders. If omitted, the list of registered loaders is used (see `registerLoaders`).
- `options`: See [`LoaderOptions`](./loader-options) for documentation of options.
- `url`: optional, assists in the autoselection of a loader if multiple loaders are supplied to `loader`.

Returns:

- Returns an async iterator that yields batches of data. The exact format for the batches depends on the _loader object_ category.

Notes:

- The `loaders` parameter can also be omitted, in which case any _loaders_ previously registered with [`registerLoaders`](/docs/modules/core/api-reference/register-loaders) will be used.

## Input Types

| Data Type                                          | Description                                                                                   | Comments                                                        |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `Response`                                         | `Response` object, e.g returned by `fetch` or `fetchFile`.                                    | Data will be streamed from the `response.body` stream.          |
| `AsyncIterator`                                    | iterator that yields promises that resolve to binary (`ArrayBuffer`) chunks or string chunks. |
| converted into async iterators behind the scenes.) |
| `Iterator`                                         | Iterator that yields binary chunks (`ArrayBuffer`) or string chunks                           | string chunks only work for loaders that support textual input. |
| `Promise`                                          | A promise that resolves to any of the other supported data types can also be supplied.        |

Note that many other data sources can also be parsed by first converting them to `Response` objects, e.g. with `fetchResoure`: http urls, data urls, `ArrayBuffer`, `String`, `File`, `Blob`, `ReadableStream` etc.
