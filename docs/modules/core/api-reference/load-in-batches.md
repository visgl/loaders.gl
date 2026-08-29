---
title: loadInBatches
description: Fetch and decode a resource as an async iterator of loader-defined batches.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Core streaming API"
  title="Start processing while the resource is still arriving."
  description="`loadInBatches()` connects fetching to `parseInBatches()`, releasing metadata and data batches through an async iterator instead of waiting for the complete resource."
  tone="violet"
  meta={['Async iterator', 'Streaming decode', 'Multiple files']}
  links={[
    {label: 'Core module', to: '/docs/modules/core'},
    {label: 'Streaming loaders', to: '/docs/developer-guide/using-streaming-loaders'}
  ]}
/>

<DocOrientation
  eyebrow="The batch path"
  title="Fetch, decode, yield, continue."
  description="Batch boundaries depend on the selected loader. They may carry metadata, schemas, record batches, tiles, or other category-specific values while the source remains open."
  tone="violet"
  items={[
    {label: 'Input', value: 'One resource or a coordinated list of files'},
    {label: 'Selection', value: 'Explicit loaders or registered autodetection'},
    {label: 'Yield', value: 'Metadata and data through an async iterator'},
    {label: 'Control', value: 'Loader options, file matching, and cancellation'}
  ]}
/>

```typescript
loadInBatches(url: string | File | ... , loaders: Loader, options?: LoaderOptions]): Promise<AsyncIrerator<unknown>>
loadInBatches(url: string | File | ... , loaders: Loader[], options?: LoaderOptions]): Promise<AsyncIrerator<unknown>>
loadInBatches(files: (string | File | ...)[] | FileList, loaders: Loader, options?: LoaderOptions]): Promise<AsyncIterator<unknown>>
loadInBatches(files: (string | File | ...)[] | FileList, loaders: Loader[], options?: LoaderOptions]): Promise<AsyncIterator<unknown>>
```

`loadInBatches` opens a `url` as a stream and passes it and options to `parseInBatches`. See the documentation of `load` and `parseInBatches` for more details.

<ReferenceBoundary
  title="Batch loading details"
  description="The sections below cover single and multiple resources, loader matching, iterator results, options, and multi-file loader behavior."
  tone="violet"
/>

Starting with [![Website shields.io](https://img.shields.io/badge/v2.3-blue.svg?style=flat-square)](http://shields.io), `loadInBatches` can also load and parse multiple files from a list of `File` objects or urls.

In this mode, it iterates over the supplied files, looking for valid loader matches, ignores files that do not match a loader and calls `parseInBatches` on each valid file/loader combination, returning an array of async batch iterators.

More importantly, when called with multiple files, `loadInBatches` makes all the supplied files avialable to all loaders (enabling multi-file loaders such as the ShapefileLoader to access multiple files).

### Usage

```typescript
const iteratorPromises = await loadInBatches([file1, file2], OBJLoader);
for await (const iterator of iteratorPromises) {
  for await (const batch of iterator) {
    // Just the one batch...
    t.equal(batch.mode, 4, 'mode is TRIANGLES (4)');
  }
}
```

```typescript
import {fetchFile, parseFilesInBatches} from '@loaders.gl/core';
import {ShapefileLoader} from '@loaders.gl/shapefile';

const batchIterators = await loadFilesInBatches([shpFile, dbfFile, projFile], ShapefileLoader));
for (const batchIterator of batchIterators) {
  // `batchIterator` represents the the output of `parseInBatches` on one of the files
  for await (const batch of batchIterator) {
    switch (batch.batchType) {
      case 'metadata':
        console.log(batch.metadata);
        break;
      default:
        processShapefile(batch);
    }
  }
}
```

Loads data in batches from a stream, releasing each batch to the application while the stream is still being read.

Parses data with the selected _loader object_. An array of `loaders` can be provided, in which case an attempt will be made to autodetect which loader is appropriate for the file (using url extension and header matching).

- `files`: loaded data or an object that allows data to be loaded. Plese refer to the table below for valid types.
- `loaders`: can be a single loader or an array of loaders. If ommitted, will use the list of registered loaders (see `registerLoaders`)
- `options`: see [`LoaderOptions`](./loader-options).

Returns:

- Returns an async iterator that yields batches of data. The exact format for the batches depends on the _loader object_ category.

Notes:

- The `loaders` parameter can also be ommitted, in which case any _loaders_ previously registered with [`registerLoaders`](/docs/modules/core/api-reference/register-loaders) will be used.

## Options

A loader object, that can contain a mix of options:

- options specific to `loadInBatches`, see below.
- options defined by the `parseInBatches` and `parse` functions can be specified.
- options specific to any loaders can also be specified (in loader specific sub-objects).

Please refer to the corresponding documentation page for for `parse` and for each loader for details.

| Option                       | Type      | Default | Description                                           |
| ---------------------------- | --------- | ------- | ----------------------------------------------------- |
| `options.ignoreUnknownFiles` | `boolean` | `true`  | Ignores unknown files if multiple files are provided. |
