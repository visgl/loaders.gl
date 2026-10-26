---
title: GeoArrowLoader
description: Read Arrow tables and preserve GeoArrow geometry columns and metadata.
hide_title: true
page_style: designed
---

import {ArrowDocsTabs} from '@site/src/components/docs/arrow-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocLiveExample} from '@site/src/components/docs/doc-live-example';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';
import {ClientExample} from '@site/src/components';

<DocPageHeader
  format="arrow"
  eyebrow="GeoArrow loader"
  title="GeoArrowLoader"
  description="GeoArrowLoader parses Arrow IPC data and recognizes GeoArrow extension metadata so geometry columns remain typed and discoverable alongside their attributes."
  tone="cyan"
  meta={['Arrow IPC', 'GeoArrow extensions', 'Feature tables']}
  links={[
    {label: 'GeoArrow format', to: '/docs/modules/tables/arrow/formats/geoarrow'},
    {label: 'ArrowLoader', to: '/docs/modules/tables/arrow/api-reference/arrow-loader'}
  ]}
/>

<DocLiveExample label="GeoArrowLoader map example" height="420px">
  <ClientExample kind="geospatial" format="GeoArrow" />
</DocLiveExample>

<ArrowDocsTabs active="geoarrowloader" />

<DocOrientation
  eyebrow="A geospatial Arrow entry point"
  title="Keep geometry metadata next to the columns."
  description="The loader uses the Arrow table as the transport and GeoArrow conventions to interpret geometry. Applications can continue with Arrow processing or convert the geometry columns for rendering."
  tone="cyan"
  items={[
    {label: 'Input', value: 'Arrow IPC files and streams with GeoArrow metadata'},
    {label: 'Geometry', value: 'Recognized geometry extension columns'},
    {label: 'Attributes', value: 'Typed feature fields remain ordinary Arrow columns'},
    {label: 'Next step', value: 'GeoArrow conversion, scanning, or rendering'}
  ]}
/>

<p className="badges">
  <img src="https://img.shields.io/badge/From-v4.1-blue.svg?style=flat-square" alt="From-v4.1" />
</p>

The `GeoArrowLoader` parses Apache Arrow columnar table format files, and looks for `GeoArrow` type extensions to parse geometries from the table.

<ReferenceBoundary
  title="GeoArrowLoader options and output"
  description="The sections below cover usage, options, recognized extension types, and the returned table shapes."
  tone="cyan"
/>

## Usage

```typescript
import {GeoArrowLoader} from '@loaders.gl/tables/arrow';
import {load} from '@loaders.gl/core';

const data = await load(url, GeoArrowLoader, options);
```

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |

## Worker parsing

Atomic parsing and `parseInBatches()` support workers with `core.worker: true`. Each batch session
retains one Arrow IPC reader, requests input on demand, and waits for the consumer before advancing
past an output batch. Batches retain the existing `arrow-table` output shape. Atomic parsing converts
to the requested output shape on the caller after hydrating the transferred Arrow data.

Workers return independently owned Arrow IPC buffers, preserving dictionaries and extension metadata
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
