---
title: ZIP
description: Read and write ZIP archives with loaders.gl.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Archive module"
  title="Open archives at the edge of your data pipeline."
  description="`@loaders.gl/archives/zip` handles ZIP decompression and construction behind a small browser- and Node.js-friendly surface. Use it when a loader or application needs to inspect an archive before handing its contents to another format handler."
  tone="violet"
  meta={['ZIP', 'Archive utilities', 'Browser and Node.js']}
  links={[
    {label: 'ZIP format', to: '/docs/modules/archives/zip/formats/zip'},
    {label: 'Using loaders', to: '/docs/developer-guide/using-loaders'},
    {label: 'ZIP APIs', to: '/docs/modules/archives/zip/api-reference/zip-loader'}
  ]}
/>

<DocOrientation
  eyebrow="The archive path"
  title="Open the container. Hand each entry to the right loader."
  description="Archive handling is usually an intermediate step: inspect entries, extract the bytes that matter, and continue through the normal loaders.gl format pipeline."
  tone="violet"
  items={[
    {label: 'Input', value: 'ZIP archive data'},
    {label: 'Inspect', value: 'Archive entries and their payload bytes'},
    {label: 'Compose', value: 'ZIP output through native encoders'},
    {label: 'Next step', value: 'Pass extracted data to a format loader'}
  ]}
/>

<ReferenceBoundary
  title="Archive implementation details"
  description="The reference below covers installation, ZIP loading and writing, options, and the upstream libraries used by the module."
  tone="violet"
/>

The `@loaders.gl/archives/zip` subpath handles ZIP archive reading and writing.

## Installation

```bash
npm install @loaders.gl/core @loaders.gl/archives
```

## Random-access archives

Use [`openZipArchive`](/docs/modules/archives/zip/api-reference/zip-archive) to inspect a ZIP32/ZIP64 archive,
read complete members with CRC validation, stream decoded entries, or read STORE byte ranges.
See the [ZIP feature table](/docs/modules/archives/zip/formats/zip) for the supported container profiles
and the limits of the current writer.

Use [`ZipFileSystem`](/docs/modules/archives/zip/api-reference/zip-filesystem) when consumers need
`fetch` responses, a cached directory, confined resource URLs, or incremental STORE ranges.

## Native writing

[`encodeZip` and `encodeZipInBatches`](/docs/modules/archives/zip/api-reference/encode-zip) write
ZIP32/ZIP64 from named buffers, Blobs or byte streams, with STORE/DEFLATE, deterministic metadata,
cancellation and output budgets. Indexed archives use the same native serializers while retaining
populated local headers. `ZipWriter` delegates to the same native encoder and additionally accepts UTF-8 string values and optional parent directory entries.

## Attributions

`ZipLoader` delegates to the shared native reader, verifies complete-entry CRCs and returns ArrayBuffer values. Its root export is metadata only; direct parser access uses `@loaders.gl/archives/zip/zip-loader`. The ZIP package runtime dependencies are loaders.gl modules only.
