---
title: Streaming loaders
description: Process large files incrementally with async iterators, batched loaders, and transforms.
hide_title: true
page_style: designed
---

import {CapabilityHero} from '@site/src/components/docs/capability-hero';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';
import {StreamingConcept} from '@site/src/components/home/concepts';

<CapabilityHero capability="streaming" />

<StreamingConcept />

<DocOrientation
  eyebrow="Streaming in one minute"
  title="Start using the data before the download finishes."
  description="A batched loader turns a response or byte stream into an async sequence of useful results. Your application handles one batch at a time with ordinary JavaScript."
  items={[
    {label: 'Use it when', value: 'Files are large, memory is limited, or latency matters.'},
    {label: 'Core API', value: 'loadInBatches() and parseInBatches()'},
    {label: 'Input → output', value: 'Response or byte stream → async data batches'},
    {label: 'Works with', value: 'CSV, JSON, GeoJSON, Parquet, and more'}
  ]}
/>

## The basic loop

If you can use `for await...of`, you can use a streaming loader. Each iteration receives parsed data
that can immediately be filtered, displayed, stored, or passed to another transform.

```typescript title="Process batches as they arrive"
import {loadInBatches} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/csv';

const batches = await loadInBatches('records.csv', CSVLoader);

for await (const batch of batches) {
  updateApplication(batch.data);
}
```

The application does not need a separate streaming framework. loaders.gl handles the input stream,
incremental parsing, and batch boundaries; the loop remains normal asynchronous JavaScript.

## Why batches help

- **Lower memory use.** The complete file does not need to fit in one `string` or `ArrayBuffer`.
- **Earlier results.** Applications can respond as soon as the first useful records are parsed.
- **Responsive processing.** Parsing and transforms are distributed across smaller units of work.
- **Composable pipelines.** Hashing, decryption, filtering, and conversion can run incrementally.

:::tip[One useful rule]

Use `load` when you need one complete result. Use `loadInBatches` when partial results are useful or
the complete input may be too large to hold in memory comfortably.

:::

<ReferenceBoundary
  title="How batched loading works"
  description="The rest of this guide covers the iterator model, supported inputs, transforms, and the details needed to build production pipelines."
/>

## Async iterators and batches

The loaders.gl streaming architecture uses ES2018 async iterators rather than requiring applications
to adopt Node.js or DOM stream APIs. Async iterators work in browsers and Node.js and support the
built-in `for await...of` syntax.

Stream input sources are still accepted. Internally, loaders.gl converts them to async iterators and
returns an async iterator that yields parsed batches.

For example, `GeoJSONLoader` can yield features from a large GeoJSON document in batches:

```typescript title="Inspect streamed GeoJSON features"
import {loadInBatches} from '@loaders.gl/core';
import {GeoJSONLoader} from '@loaders.gl/json';

const batches = await loadInBatches('features.geojson', GeoJSONLoader);

for await (const batch of batches) {
  for (const feature of batch.data) {
    if (feature.geometry.type === 'Polygon') {
      displayPolygon(feature);
    }
  }
}
```

## Supported input sources

The primary input for `parseInBatches` is an async iterator, but applications can provide several
common streaming types:

- `AsyncIterable<ArrayBuffer>` yielding binary chunks.
- A DOM or Node.js `Stream`, which loaders.gl converts to an async iterator.
- A `Response`; its `body` stream supplies the incoming bytes.

Applications can also wrap `FormData`, `Blob`, `File`, `string`, or `ArrayBuffer` values in a
`Response`. This provides one consistent path for network responses and local data.

## Applying transforms

Transforms process each incoming chunk without waiting for the complete source. This example
calculates a checksum while CSV batches are being parsed:

```typescript title="Calculate a checksum incrementally"
import {loadInBatches} from '@loaders.gl/core';
import {CRC32HashTransform} from '@loaders.gl/crypto';
import {CSVLoader} from '@loaders.gl/csv';

let hash;

const batches = await loadInBatches('records.csv', CSVLoader, {
  transforms: [CRC32HashTransform],
  crypto: {
    onEnd: (result) => {
      hash = result.hash;
    }
  }
});

for await (const batch of batches) {
  storeRows(batch.data);
}

console.log(hash);
```

The transform sees data incrementally, so it does not require a second in-memory copy of the entire
source. Expensive work is also spread across batches instead of happening in one long operation.

## Choosing a batch size

Batch size balances responsiveness and throughput. Smaller batches can produce the first visible
result sooner, while larger batches reduce per-batch overhead. Start with the loader default and tune
only when measurements show that latency or throughput needs attention.

The available option and exact batch shape depend on the loader. Consult the loader's API page for
format-specific behavior.

## Related reading

- [Streaming concepts](./concepts/streaming)
- [Using workers](./using-worker-loaders)
- [Loader categories](./loader-categories)
- [`loadInBatches` API](../modules/core/api-reference/load-in-batches)
