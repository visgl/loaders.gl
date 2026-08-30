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
    {label: 'Contents', value: 'ArrayBuffer or string values for each entry'},
    {label: 'Next step', value: 'Dispatch extracted resources to their format loaders'}
  ]}
/>

<ReferenceBoundary
  title="ZipLoader reference"
  description="The sections below document archive metadata, usage, file-map output, and options forwarded to JSZip."
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
| Worker Thread  | No                                           |
| Streaming      | No                                           |

## Usage

```typescript
import {parse} from '@loaders.gl/core';
import {ZipLoader} from '@loaders.gl/zip';

const fileMap = await parse(arrayBuffer, ZipLoader);
for (const fileName in FILE_MAP) {
  const fileData = fileMap[key];
  // Do something with the subfile
}
```

## Data Format

The file map is an object with keys representing file names or relative paths in the zip file, and values being the contents of each sub file (either `ArrayBuffer` or `String`).

## Options

Options are forwarded to [JSZip.loadAsync](https://stuk.github.io/jszip/documentation/api_jszip/load_async.html).
