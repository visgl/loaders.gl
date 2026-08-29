---
title: ArrowWriter
description: Encode typed table data as Apache Arrow IPC files or streams.
hide_title: true
page_style: designed
---

import {ArrowDocsTabs} from '@site/src/components/docs/arrow-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';
import {WriterPipelineGraphic} from '@site/src/components/docs/writer-pipeline-graphic';

<DocPageHeader
  eyebrow="Arrow writer"
  title="Write the table shape your next system can reuse."
  description="ArrowWriter turns typed arrays and table-oriented data into Apache Arrow IPC bytes. Use it when a result should remain columnar across files, streams, workers, or another language."
  tone="cyan"
  meta={['Arrow IPC', 'Typed columns', 'File and stream output']}
  links={[
    {label: 'Arrow format', to: '/docs/modules/arrow/formats/arrow'},
    {label: 'Arrow module', to: '/docs/modules/arrow'}
  ]}
/>

<ArrowDocsTabs active="arrowwriter" />

<WriterPipelineGraphic />

<DocOrientation
  eyebrow="Encode once, reuse elsewhere"
  title="Keep types and column boundaries intact."
  description="The writer accepts table-oriented arrays and emits an IPC representation that Arrow readers can consume. The output can be saved, streamed, or passed to another loaders.gl pipeline."
  tone="cyan"
  items={[
    {label: 'Input', value: 'Typed arrays, dates, strings, and Arrow-compatible fields'},
    {label: 'Output', value: 'Apache Arrow IPC ArrayBuffer data'},
    {label: 'Use with', value: 'encode, writeFile, workers, and table sources'},
    {label: 'Next step', value: 'Read with ArrowLoader or any Arrow implementation'}
  ]}
/>

<p className="badges">
  <img src="https://img.shields.io/badge/From-v3.0-blue.svg?style=flat-square" alt="From-v3.0" />
</p>

The `ArrowWriter` encodes a set of arrays into an Apache Arrow IPC stream or file. The file
container is Feather V2 and can optionally use LZ4-frame or Zstandard embedded buffer compression.

<ReferenceBoundary
  title="ArrowWriter options and shapes"
  description="The sections below cover usage, input arrays, options, and the resulting Arrow IPC data."
  tone="cyan"
/>

## Usage

```typescript
import {encodeSync} from '@loaders.gl/core';
import {ArrowWriter, VECTOR_TYPES} from '@loaders.gl/arrow';

const LENGTH = 2000;

const rainAmounts = Float32Array.from({length: LENGTH}, () =>
  Number((Math.random() * 20).toFixed(1))
);

const rainDates = Array.from(
  {length: LENGTH},
  (_, i) => new Date(Date.now() - 1000 * 60 * 60 * 24 * i)
);

const arraysData = [
  {array: rainAmounts, name: 'precipitation', type: VECTOR_TYPES.FLOAT},
  {array: rainDates, name: 'date', type: VECTOR_TYPES.DATE}
];

const arrayBuffer = encodeSync(arraysData, ArrowWriter);
```

To write a compressed Feather V2 file:

```typescript
import {encode} from '@loaders.gl/core';
import {ZstdCodec} from 'zstd-codec';

const featherBuffer = await encode(arraysData, ArrowWriter, {
  modules: {'zstd-codec': ZstdCodec},
  arrow: {
    container: 'file',
    compression: 'zstd'
  }
});
```

LZ4 compression supports `encodeSync` without an injected module. Zstandard compression uses
asynchronous `encode` and an injected `zstd-codec` module so its codec can be initialized without
adding the large optional encoder to every Arrow browser bundle.

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `arrow.container` | `'stream'` \| `'file'` | `'stream'` | Selects the Arrow IPC stream or file container. Feather V2 uses `'file'`. |
| `arrow.compression` | `null` \| `'lz4'` \| `'zstd'` | `null` | Selects embedded record-batch buffer compression. Compression requires Apache Arrow JS 21.2 or later. |

The input arrays determine the Arrow field names and types; use the exported `VECTOR_TYPES`
constants when constructing the input.

## Dependencies

[Apache Arrow JS](https://arrow.apache.org/docs/js/) library is included into the bundle.

Install [`zstd-codec`](https://www.npmjs.com/package/zstd-codec) when writing Zstandard-compressed
IPC data. Decoding Zstandard data and reading or writing LZ4 data require no additional package.
