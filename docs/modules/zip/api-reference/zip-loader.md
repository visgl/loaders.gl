---
title: ZipLoader
description: Decode a ZIP archive into a file map of paths and contents.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="ZIP API · archive loader"
  title="Open an archive into named resources."
  description="ZipLoader turns a ZIP archive into a file map, keeping each path and its decoded contents available to the application. It is the useful boundary for bundled assets, fixtures, and nested data packages."
  tone="violet"
  meta={['From v1.0', 'File map output', 'Asynchronous decode']}
  links={[
    {label: 'ZIP module', to: '/docs/modules/zip'},
    {label: 'ZIP format', to: '/docs/modules/zip/formats/zip'},
    {label: 'ZipWriter', to: '/docs/modules/zip/api-reference/zip-writer'}
  ]}
/>

<DocOrientation
  eyebrow="The archive path"
  title="Keep the archive boundary simple: path in, content out."
  description="The loader handles ZIP structure and returns an object keyed by archive paths. The application decides which entries to parse next and which loaders should handle them."
  tone="violet"
  items={[
    {label: 'Input', value: 'ZIP bytes as an ArrayBuffer or loader input'},
    {label: 'Output', value: 'File map keyed by names or relative paths'},
    {label: 'Contents', value: 'ArrayBuffer values for each file'},
    {label: 'Next step', value: 'Dispatch extracted resources to their format loaders'}
  ]}
/>

<ReferenceBoundary
  title="ZipLoader reference"
  description="The sections below document archive metadata, usage, file-map output, and native validation and decoded-output limits."
  tone="violet"
/>

<p className="badges">
  <img src="https://img.shields.io/badge/From-v1.0-blue.svg?style=flat-square" alt="From-v1.0" />
</p>

Decodes a Zip Archive into a file map.

| Loader         | Characteristic                               |
| -------------- | -------------------------------------------- |
| File Extension | `.zip`                                       |
| File Type      | Binary                                       |
| File Format    | [ZIP Archive](/docs/modules/zip/formats/zip) |
| Data Format    | "File Map"                                   |
| Decoder Type   | Asynchronous                                 |
| Worker Thread  | ❌ No                                           |
| Streaming      | ❌ No                                           |

## Usage

```typescript
import {parse} from '@loaders.gl/core';
import {ZipLoader} from '@loaders.gl/zip';

const fileMap = await parse(arrayBuffer, ZipLoader);
for (const fileName in fileMap) {
  const fileData = fileMap[fileName];
  // Do something with the subfile
}
```

## Data Format

The file map is an object with keys representing file names or relative paths in the zip file, and values being the contents of each sub file as an `ArrayBuffer`. Directory entries are omitted. The map has a null prototype, so names such as `__proto__` remain ordinary file keys. Errors reject the parse instead of appearing as map values.

## Options

The typed `zip` namespace accepts the limits and `signal` documented for
[`openZipArchive`](/docs/modules/zip/api-reference/zip-archive).
Complete reads always verify decoded sizes and CRC-32. Unsupported ZIP profiles reject.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `zip.maxTotalDecodedBytes` | `bigint` | `64n * 1024n * 1024n` | Sum of file sizes retained in the result; checked before decoding payloads. |
| `zip.maxDecodedBytes` | `bigint` | `64n * 1024n * 1024n` | Maximum decoded bytes per complete entry. |
| `zip.maxCompressedBytes` | `bigint` | `64n * 1024n * 1024n` | Maximum compressed bytes per complete entry. |
| `zip.signal` | `AbortSignal` | — | Cancels archive initialization and reads. |

The total-map, decoded-entry and compressed-entry limits are independent. Raising
`maxTotalDecodedBytes` does not raise either entry limit. For an entry larger than 64 MiB,
set `maxDecodedBytes` and, when its compressed payload is also larger, `maxCompressedBytes`.
These limits bound encoded/decoded byte counts, not decoder intermediates or total heap.
Use the shared archive API for incremental or range reads instead of retaining a complete map.

The package root exports metadata. For direct parser access:

```ts
import {ZipLoaderWithParser} from '@loaders.gl/zip/zip-loader';
const files = await ZipLoaderWithParser.parse(arrayBuffer, {
  zip: {
    maxTotalDecodedBytes: 256n * 1024n * 1024n,
    maxDecodedBytes: 128n * 1024n * 1024n,
    maxCompressedBytes: 128n * 1024n * 1024n
  }
});
```
