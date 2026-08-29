---
title: CompressedTextureWriter
description: Encode image data through an optional native compressed-texture toolchain.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';
import {TexturesDocsTabs} from '@site/src/components/docs/textures-docs-tabs';

<DocPageHeader
  eyebrow="Compressed texture writer"
  title="Keep the compression step at the build or Node.js boundary."
  description="`CompressedTextureWriter` is an experimental Node.js-only bridge to an externally installed native compressor. It is useful when an application needs to produce a GPU texture container, but it is not a browser-side encoder."
  tone="mint"
  meta={['Experimental', 'Node.js only', 'Optional native compressor']}
  links={[
    {label: 'Textures module', to: '/docs/modules/textures'},
    {label: 'Compressed textures', to: '/docs/modules/textures/formats/compressed-textures'},
    {label: 'Using writers', to: '/docs/developer-guide/using-writers'}
  ]}
/>

<TexturesDocsTabs active="compressedtexturewriter" />

<DocOrientation
  eyebrow="The compression boundary"
  title="Prepare image input. Invoke the local toolchain. Write a GPU container."
  description="The writer delegates actual compression to `texture-compressor`. Keep that dependency explicit and run this path in build tooling or a controlled Node.js process."
  tone="mint"
  items={[
    {label: 'Input', value: 'Encoded image URL or compatible image input'},
    {label: 'Toolchain', value: 'Application-installed texture-compressor package'},
    {label: 'Encode', value: 'Native compressor produces GPU blocks'},
    {label: 'Output', value: 'Compressed texture container at the destination URL'}
  ]}
/>

<TexturesDocsTabs active="compressedtexturewriter" />

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.0-blue.svg?style=flat-square" alt="From-v3.0" />
  <img src="https://img.shields.io/badge/Node.js-only-red.svg?style=flat-square" alt="Node.js-only" />
</p>

> The experimental `CompressedTextureWriter` class can encode a binary encoded image into a compressed texture.

<ReferenceBoundary
  title="Writer prerequisites and limitations"
  description="The reference below covers installation, Node.js constraints, output assumptions, native tool invocation, and current experimental limitations."
  tone="mint"
/>

:::caution
This writer works by loading the [`texture-compressor`](https://github.com/TimvanScherpenzeel/texture-compressor) package, which runs its bundled native compressor. That package is **not** installed by `@loaders.gl/textures`. Applications that use this writer must install it themselves:

```bash
npm install --save-dev texture-compressor
```

The package is resolved as an optional peer dependency and called directly. The writer does not invoke `npx` or access the npm registry. If the package cannot be resolved locally, `encodeURLtoURL()` rejects.
:::

| Loader         | Characteristic                                         |
| -------------- | ------------------------------------------------------ |
| File Extension |                                                        |
| File Type      | Binary                                                 |
| Data Format    |                                                        |
| File Format    |                                                        |
| Encoder Type   | Asynchronous                                           |
| Worker Thread  | No (but may run on separate native thread in browsers) |
| Streaming      | No                                                     |

## Usage

```typescript
import '@loaders.gl/polyfill'; // only if using under Node
import {encodeURLtoURL} from '@loaders.gl/core';
import {CompressedTextureWriter} from '@loaders.gl/textures';

export const IMAGE_URL = 'image.png';

const outputFilename = await encodeURLtoURL(IMAGE_URL, '/tmp/test.ktx', CompressedTextureWriter);

// app can now read the file from outputFilename
```

## Data Format

TBA

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |

## Remarks

- Requires the `texture-compressor` package to be installed by the application, see the note above.
- Output is currently hardcoded to the S3TC/DXT1 compression format, and the CLI only writes `.ktx` containers, so `outputUrl` must end in `.ktx` despite the writer being registered under the `dds` id.
- For more information, see [`texture-compressor`](https://github.com/TimvanScherpenzeel/texture-compressor).
