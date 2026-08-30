---
title: ZipWriter
description: Encode a loaders.gl file map as a ZIP archive with optional progress reporting.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="ZIP API · archive writer"
  title="Package named resources into one archive."
  description="ZipWriter accepts a file map and emits a valid ZIP archive. Paths can represent nested files or explicit directories, while progress and JSZip options remain available when needed."
  tone="violet"
  meta={['File map input', 'ArrayBuffer output', 'Progress callbacks']}
  links={[
    {label: 'ZIP module', to: '/docs/modules/zip'},
    {label: 'ZIP format', to: '/docs/modules/zip/formats/zip'},
    {label: 'ZipLoader', to: '/docs/modules/zip/api-reference/zip-loader'}
  ]}
/>

<DocOrientation
  eyebrow="The archive writing path"
  title="Build the archive from the paths your application already owns."
  description="Use a file map to describe archive contents without manually managing ZIP records. The writer preserves nested paths and can report progress while JSZip creates the final bytes."
  tone="violet"
  items={[
    {label: 'Input', value: 'Object of archive paths and string or binary contents'},
    {label: 'Directories', value: 'Trailing slash keys become directory entries'},
    {label: 'Output', value: 'ArrayBuffer containing a ZIP archive'},
    {label: 'Control', value: 'Progress callback, folder creation, and JSZip options'}
  ]}
/>

<ReferenceBoundary
  title="ZipWriter reference"
  description="The sections below document file-map input, nested paths, output behavior, progress callbacks, and archive options."
  tone="violet"
/>

Encodes a filemap into a Zip Archive. Returns an `ArrayBuffer` that is a valid Zip Archive and can be written to file.

| Loader         | Characteristic                               |
| -------------- | -------------------------------------------- |
| File Format    | [ZIP Archive](/docs/modules/zip/formats/zip) |
| Data Format    | "File Map"                                   |
| File Extension | `.zip`                                       |
| File Type      | Binary                                       |
| Encoder Type   | Asynchronous                                 |
| Worker Thread  | No                                           |
| Streaming      | No                                           |

## Usage

```typescript
import {encode, writeFile} from '@loaders.gl/core';
import {ZipWriter} from '@loaders.gl/zip';

const FILE_MAP = {
  filename1: arrayBuffer1,
  'directory/filename2': arrayBuffer2,
  'directory/nested/': ''
};

const arrayBuffer = await encode(FILE_MAP, ZipWriter);
writeFile(zipFileName, arrayBuffer);
```

## File Format

The file map is an object with keys representing file names or relative paths in the zip file, and values being the contents of each subfile (either `ArrayBuffer` or `String`).

- Nested keys such as `folder/file.txt` are written as file paths inside the archive.
- Keys ending with `/` are written as directory entries.
- Parent directory entries can also be emitted for nested file keys.

## Options

Archive output always uses `type: 'arraybuffer'`.

| Option              | From                                                                                                          | Type                                    | Default    | Description                                                                                           |
| ------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------- |
| `zip.onUpdate`      |                                                                                                               | `(metadata: {percent: number}) => void` | `() => {}` | Receives progress updates while the archive is generated.                                             |
| `zip.createFolders` | [![Website shields.io](https://img.shields.io/badge/From-v4.4-blue.svg?style=flat-square)](http://shields.io) | `boolean`                               | `false`    | Creates parent directory entries for nested file keys such as `folder/sub/file.txt`.                  |
| `jszip`             |                                                                                                               | `object`                                | `{}`       | Passes JSZip file and archive generation options through to the underlying writer as an escape hatch. |

Explicit slash-suffixed keys are written as directory entries whether or not `zip.createFolders` is enabled.
