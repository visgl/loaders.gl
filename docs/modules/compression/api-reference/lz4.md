---
title: LZ4 compressor and decompressor
description: Read and write LZ4 frames and raw blocks through the loaders.gl compression APIs.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Compression module · API reference"
  title="Handle LZ4 frames, blocks, and legacy payloads."
  description="LZ4Compressor and LZ4Decompressor preserve the format distinctions that matter while presenting one compact API to applications and container formats."
  tone="mint"
  meta={['LZ4 frames', 'Raw blocks', 'Hadoop framing']}
  links={[
    {label: 'Compression module', to: '/docs/modules/compression'},
    {label: 'Shared codec API', to: '/docs/modules/compression/api-reference/compressor-decompressor'},
    {label: 'Benchmarks', to: '/docs/modules/compression/benchmarks'}
  ]}
/>

<DocOrientation
  eyebrow="Supported layouts"
  title="Pick the layout at the format boundary."
  description="Frame decoding can be selected when the payload carries its own framing. Raw blocks and Hadoop-framed blocks remain available for container formats that provide their own size and metadata."
  tone="mint"
  items={[
    {label: 'Frames', value: 'Self-describing LZ4 frame streams'},
    {label: 'Raw blocks', value: 'Caller supplies the expected output size'},
    {label: 'Hadoop', value: 'Legacy Hadoop-framed LZ4 blocks'},
    {label: 'Backends', value: 'lz4js or compress-utils as needed'}
  ]}
/>

<ReferenceBoundary
  title="LZ4 implementation details"
  description="The reference below documents imports, supported layouts, backend selection, and measured performance."
  tone="mint"
/>

# LZ4 Compressor and Decompressor

<p className="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From v5.0" />
</p>

`LZ4Compressor` writes LZ4 frames with lazy `lz4js`. `LZ4Decompressor` preserves loaders.gl's
compact hand-written block and Hadoop decoder and loads `lz4js` only when frame decoding requires
it.

```typescript
import {LZ4Compressor, LZ4Decompressor} from '@loaders.gl/compression';
```

Both implement the shared [Compressor and Decompressor](./compressor-decompressor) APIs. Raw block
decompression may require the expected uncompressed size as the second argument.

## Supported layouts

- LZ4 frames
- Raw LZ4 blocks
- Legacy Hadoop-framed LZ4 blocks

## Backend choices

| Backend | Compressor subpath | Decompressor subpath |
| --- | --- | --- |
| lz4js | `lz4-compressor-lz4js` | `lz4-decompressor-lz4js` |
| compress-utils | `lz4-compressor-compress-utils` | `lz4-decompressor-compress-utils` |

See the [live benchmarks](/docs/modules/compression/benchmarks) for measured frame performance.
