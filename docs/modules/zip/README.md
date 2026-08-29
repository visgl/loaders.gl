---
title: ZIP and TAR
description: Read archives and construct TAR output with loaders.gl utilities.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Archive module"
  title="Open archives at the edge of your data pipeline."
  description="`@loaders.gl/zip` handles ZIP decompression and TAR construction behind a small browser- and Node.js-friendly surface. Use it when a loader or application needs to inspect an archive before handing its contents to another format handler."
  tone="violet"
  meta={['ZIP and TAR', 'Archive utilities', 'Browser and Node.js']}
  links={[
    {label: 'ZIP format', to: '/docs/modules/zip/formats/zip'},
    {label: 'Using loaders', to: '/docs/developer-guide/using-loaders'},
    {label: 'ZIP APIs', to: '/docs/modules/zip/api-reference/zip-loader'}
  ]}
/>

<DocOrientation
  eyebrow="The archive path"
  title="Open the container. Hand each entry to the right loader."
  description="Archive handling is usually an intermediate step: inspect entries, extract the bytes that matter, and continue through the normal loaders.gl format pipeline."
  tone="violet"
  items={[
    {label: 'Input', value: 'ZIP or TAR archive data'},
    {label: 'Inspect', value: 'Archive entries and their payload bytes'},
    {label: 'Compose', value: 'TAR output through the archive builder'},
    {label: 'Next step', value: 'Pass extracted data to a format loader'}
  ]}
/>

<ReferenceBoundary
  title="Archive implementation details"
  description="The reference below covers installation, ZIP loading, TAR construction, options, and the upstream libraries used by the module."
  tone="violet"
/>

The `@loaders.gl/zip` module handles compressing and decompressing of the [ZIP](<https://en.wikipedia.org/wiki/Zip_(file_format)>) and [TAR](<https://en.wikipedia.org/wiki/Tar_(computing)>) format.

## Installation

```bash
npm install @loaders.gl/core @loaders.gl/zip
```

## Attributions

ZipLoader is a wrapper around the [JSZip module](https://stuk.github.io/jszip/). JSZip has extensive documentation on options (and more functionality than this loader object can expose).

TarBuilder uses a modified version of [tar-js](https://github.com/beatgammit/tar-js), which is under MIT license, for tar archive construction.
