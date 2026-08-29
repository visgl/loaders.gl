---
title: Built-in compression and decompression
description: Use browser-native compression streams when the runtime provides them, with documented fallbacks.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Compression API · runtime selection"
  title="Use the runtime’s codec before shipping another one."
  description="The built-in helpers probe CompressionStream and DecompressionStream for supported formats, then return control to a compact fallback when the browser or Node.js runtime cannot provide the native path."
  tone="violet"
  meta={['Native streams first', 'Compact fallbacks', 'One-shot and batches']}
  links={[
    {label: 'Compression module', to: '/docs/modules/compression'},
    {label: 'Shared codec API', to: '/docs/modules/compression/api-reference/compressor-decompressor'},
    {label: 'Live benchmarks', to: '/docs/modules/compression/benchmarks'}
  ]}
/>

<DocOrientation
  eyebrow="The built-in path"
  title="Probe capability without making it your application’s problem."
  description="Native support varies by format and runtime. The helpers return a usable result when the native stream exists and a clear null when the caller should select a fallback."
  tone="violet"
  items={[
    {label: 'Compression', value: 'gzip, deflate, brotli, and zstd where supported'},
    {label: 'Decompression', value: 'gzip, deflate, deflate-raw, brotli, and zstd where supported'},
    {label: 'Fallback', value: 'Load a compact or specialized implementation only when needed'},
    {label: 'Measurement', value: 'Use the browser benchmark page for current support and throughput'}
  ]}
/>

<ReferenceBoundary
  title="Native helpers and fallback selection"
  description="The sections below document helper entry points, accepted format names, null behavior, and error handling after stream creation."
  tone="violet"
/>

<p className="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From v5.0" />
</p>

The default GZIP, DEFLATE, Brotli, and Zstandard classes first ask the runtime for a built-in
`CompressionStream` or `DecompressionStream`. Built-in codecs add no JavaScript codec bytes and
typically offer excellent throughput. Availability varies by format and runtime, so every default
class has a documented fallback.

Most applications should simply use a format default:

```typescript
import {GZipDecompressor} from '@loaders.gl/compression';

const data = await new GZipDecompressor().decompress(compressedData);
```

## Low-level helpers

Applications that want full control over fallback loading can import the lightweight helpers:

```typescript
import {decompressWithNativeDecompressionStream} from '@loaders.gl/compression/native-decompression';

const builtInOutput = await decompressWithNativeDecompressionStream(compressedData, 'gzip');
if (!builtInOutput) {
  const {GZipDecompressor} = await import('@loaders.gl/compression/gzip-decompressor');
  return new GZipDecompressor({useNative: false}).decompress(compressedData);
}
```

| Entry point | One-shot helper | Batch helper |
| --- | --- | --- |
| `native-compression` | `compressWithNativeCompressionStream()` | `compressBatchesWithNativeCompressionStream()` |
| `native-decompression` | `decompressWithNativeDecompressionStream()` | `decompressBatchesWithNativeDecompressionStream()` |

The helpers return `null` when the stream API or exact format is unavailable. Once a stream has
been created, codec or input errors are reported to the caller.

Compression accepts `gzip`, `deflate`, `brotli`, and `zstd`. Decompression additionally accepts
`deflate-raw`. Consult the [live benchmarks](/docs/modules/compression/benchmarks) for the support
detected by the current browser.
