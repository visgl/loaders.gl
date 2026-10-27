---
title: ArrowLoader
description: Parse Arrow IPC files and streams into typed loaders.gl table shapes.
hide_title: true
page_style: designed
---

import {ArrowDocsTabs} from '@site/src/components/docs/arrow-docs-tabs';
import {ArrowJsStructureGraphic} from '@site/src/components/docs/arrow-js-structure-graphic';
import {CapabilityHero} from '@site/src/components/docs/capability-hero';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<CapabilityHero
  capability="arrow"
  eyebrow="Arrow module / loader"
  title="ArrowLoader"
  description="Read Arrow IPC data and keep its typed, columnar structure as it enters your application."
  links={[
    {label: 'Arrow format', to: '/docs/modules/tables/arrow/formats/arrow'},
    {label: 'ArrowWriter', to: '/docs/modules/tables/arrow/api-reference/arrow-writer'}
  ]}
/>

<ArrowDocsTabs active="arrowloader" />

<ArrowJsStructureGraphic />

<DocOrientation
  eyebrow="What ArrowLoader preserves"
  title="Bring the columns in without turning them into rows."
  description="ArrowLoader keeps IPC data in its typed table form by default, while allowing applications to choose a different loaders.gl table shape when an integration needs it."
  tone="cyan"
  items={[
    {label: 'Input', value: 'Arrow IPC files, streams, and compatible responses'},
    {label: 'Default', value: "ArrowTable output with shape: 'arrow-table'"},
    {label: 'Alternatives', value: 'Columnar, array-row, or object-row table wrappers'},
    {label: 'Streaming', value: 'Incremental Arrow batches with optional debounce'}
  ]}
/>

<p className="badges">
  <img src="https://img.shields.io/badge/From-v1.0-blue.svg?style=flat-square" alt="From-v1.0" />
</p>

The `ArrowLoader` parses the Apache Arrow columnar table format.

<ReferenceBoundary
  title="ArrowLoader usage and options"
  description="The reference below covers loading, returned shapes, batch behavior, and the options that control table conversion."
  tone="cyan"
/>

## Usage

```typescript
import {ArrowLoader} from '@loaders.gl/tables/arrow';
import {load} from '@loaders.gl/core';

const data = await load(url, ArrowLoader, options);
```

## Shapes

`ArrowLoader` returns loaders.gl `ArrowTable` objects by default. Set `arrow.shape` to select another table representation.

| Shape              | Output                                                 |
| ------------------ | ------------------------------------------------------ |
| `arrow-table`      | loaders.gl `ArrowTable` wrapping an Apache Arrow table |
| `columnar-table`   | loaders.gl columnar table                              |
| `array-row-table`  | loaders.gl row table with arrays                       |
| `object-row-table` | loaders.gl row table with objects                      |

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `arrow.shape` | `'arrow-table' \| 'columnar-table' \| 'array-row-table' \| 'object-row-table'` | `'arrow-table'` | Selects the returned loaders.gl table shape. |
| `arrow.batchDebounceMs` | `number` | `undefined` | Adds an async delay between emitted Arrow batches. |

## Worker parsing

Atomic parsing and `parseInBatches()` support workers with `core.worker: true`. Each batch session
retains one Arrow IPC reader, requests input on demand, and waits for the consumer before advancing
past an output batch. Batches retain the existing `arrow-table` output shape. Atomic parsing converts
to the requested output shape on the caller after hydrating the transferred Arrow data.

Workers return owned Arrow column buffers, preserving dictionaries and extension metadata
without transferring buffers still referenced by the reader. Decoded JSON rows and GeoJSON features
are never structured-cloned across the worker boundary. Small table and protocol descriptors accompany
the buffers. Input chunks can still be large; backpressure does not bound an individual input chunk.

Pass `signal` to cancel a queued or running job. Breaking from iteration closes the input and releases
the worker. Iterator cleanup is best effort and does not delay cancellation. Transferred inputs remain
detached after cancellation.

Browser workers use the published asset fallback; set `arrow.workerUrl` to self-host the matching
worker bundle. Node worker threads require `core._nodeWorkers: true` and use the packaged CommonJS
bundle. Set `core.workerInBatches: false` to keep batches on the caller. Custom worker URLs require
`core.workerInBatches: true` to declare compatibility with the batch protocol.
