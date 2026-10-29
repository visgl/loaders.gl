GeoArrow loader

![](/next/images/format-logos/apache-arrow-logo.png)

# GeoArrowLoader

GeoArrowLoader parses Arrow IPC data and recognizes GeoArrow extension metadata so geometry columns remain typed and discoverable alongside their attributes.

[GeoArrow format](https://loaders.gl/next/docs/modules/tables/arrow/formats/geoarrow.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/arrow/formats/geoarrow.md)[ArrowLoader](https://loaders.gl/next/docs/modules/tables/arrow/api-reference/arrow-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/arrow/api-reference/arrow-loader.md)

⛶⛶ Explore fullscreen

![](/next/images/format-logos/apache-arrow-logo.png)[Try It](https://loaders.gl/next/examples/table/arrow)[Overview](https://loaders.gl/next/docs/modules/tables/arrow/formats/arrow.md)[Format](https://loaders.gl/next/docs/modules/tables/arrow/format.md)[ArrowLoader](https://loaders.gl/next/docs/modules/tables/arrow/api-reference/arrow-loader.md)[ArrowWriter](https://loaders.gl/next/docs/modules/tables/arrow/api-reference/arrow-writer.md)[GeoArrow](https://loaders.gl/next/docs/modules/tables/arrow/formats/geoarrow.md)[GeoArrowLoader](https://loaders.gl/next/docs/modules/tables/arrow/api-reference/geoarrow-loader.md)

A geospatial Arrow entry point

## Keep geometry metadata next to the columns.

The loader uses the Arrow table as the transport and GeoArrow conventions to interpret geometry. Applications can continue with Arrow processing or convert the geometry columns for rendering.

01

Input

Arrow IPC files and streams with GeoArrow metadata

02

Geometry

Recognized geometry extension columns

03

Attributes

Typed feature fields remain ordinary Arrow columns

04

Next step

GeoArrow conversion, scanning, or rendering

![From-v4.1](https://img.shields.io/badge/From-v4.1-blue.svg?style=flat-square)

The `GeoArrowLoader` parses Apache Arrow columnar table format files, and looks for `GeoArrow` type extensions to parse geometries from the table.

Detailed guide

## GeoArrowLoader options and output

The sections below cover usage, options, recognized extension types, and the returned table shapes.

## Usage[​](#usage "Direct link to Usage")

```
import {GeoArrowLoader} from '@loaders.gl/tables/arrow';

import {load} from '@loaders.gl/core';



const data = await load(url, GeoArrowLoader, options);
```

## Options[​](#options "Direct link to Options")

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |

## Worker parsing[​](#worker-parsing "Direct link to Worker parsing")

Atomic parsing and `parseInBatches()` support workers with `core.worker: true`. Each batch session retains one Arrow IPC reader, requests input on demand, and waits for the consumer before advancing past an output batch. Batches retain the existing `arrow-table` output shape. Atomic parsing converts to the requested output shape on the caller after hydrating the transferred Arrow data.

Workers return owned Arrow column buffers, preserving dictionaries and extension metadata without transferring buffers still referenced by the reader. Decoded JSON rows and GeoJSON features are never structured-cloned across the worker boundary. Small table and protocol descriptors accompany the buffers. Input chunks can still be large; backpressure does not bound an individual input chunk.

Pass `signal` to cancel a queued or running job. Breaking from iteration closes the input and releases the worker. Iterator cleanup is best effort and does not delay cancellation. Transferred inputs remain detached after cancellation.

Browser workers use the published asset fallback; set `arrow.workerUrl` to self-host the matching worker bundle. Node worker threads require `core._nodeWorkers: true` and use the packaged CommonJS bundle. Set `core.workerInBatches: false` to keep batches on the caller. Custom worker URLs require `core.workerInBatches: true` to declare compatibility with the batch protocol.
