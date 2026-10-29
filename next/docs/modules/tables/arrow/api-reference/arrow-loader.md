Arrow module / loader

# ArrowLoader

Read Arrow IPC data and keep its typed, columnar structure as it enters your application.

typed columnszero-copyArrow IPC

[Arrow format](https://loaders.gl/next/docs/modules/tables/arrow/formats/arrow.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/arrow/formats/arrow.md)[ArrowWriter](https://loaders.gl/next/docs/modules/tables/arrow/api-reference/arrow-writer.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/arrow/api-reference/arrow-writer.md)

![](/next/images/format-logos/apache-arrow-logo.png)[Try It](https://loaders.gl/next/examples/table/arrow)[Overview](https://loaders.gl/next/docs/modules/tables/arrow/formats/arrow.md)[Format](https://loaders.gl/next/docs/modules/tables/arrow/format.md)[ArrowLoader](https://loaders.gl/next/docs/modules/tables/arrow/api-reference/arrow-loader.md)[ArrowWriter](https://loaders.gl/next/docs/modules/tables/arrow/api-reference/arrow-writer.md)[GeoArrow](https://loaders.gl/next/docs/modules/tables/arrow/formats/geoarrow.md)[GeoArrowLoader](https://loaders.gl/next/docs/modules/tables/arrow/api-reference/geoarrow-loader.md)

Inside an Arrow table

## Tables are columns, batches, and buffers.

The JavaScript API exposes the same columnar structure that makes Arrow efficient: a schema describes fields, vectors hold typed values, and buffers carry the bytes.

### Schema

fields

metadata

Field

name

Type

nullable

metadata

Field

name

Type

nullable

metadata

Field

name

Type

nullable

metadata

### Table

Vector

Vector

Vector

RecordBatch

Data

Data

Data

RecordBatch

Data

Data

Data

RecordBatch

Data

Data

Data

### Vector

Vector

type

length

stride

data

Data

Data

Data

...

### Data buffers

Data

type

length

nullCount

offset

buffers

validity

offsets

values

childData

Data

Data

...

### Data type

DataType

typeId

ArrayType

OffsetArrayType

params

bitWidth

precision

unit

...

children

Field

Field

Field

...

The application can stay at the table boundary; these lower-level objects matter when inspecting schemas, building zero-copy views, or implementing an adapter.

What ArrowLoader preserves

## Bring the columns in without turning them into rows.

ArrowLoader keeps IPC data in its typed table form by default, while allowing applications to choose a different loaders.gl table shape when an integration needs it.

01

Input

Arrow IPC files, streams, and compatible responses

02

Default

ArrowTable output with shape: 'arrow-table'

03

Alternatives

Columnar, array-row, or object-row table wrappers

04

Streaming

Incremental Arrow batches with optional debounce

![From-v1.0](https://img.shields.io/badge/From-v1.0-blue.svg?style=flat-square)

The `ArrowLoader` parses the Apache Arrow columnar table format.

Detailed guide

## ArrowLoader usage and options

The reference below covers loading, returned shapes, batch behavior, and the options that control table conversion.

## Usage[​](#usage "Direct link to Usage")

```
import {ArrowLoader} from '@loaders.gl/tables/arrow';

import {load} from '@loaders.gl/core';



const data = await load(url, ArrowLoader, options);
```

## Shapes[​](#shapes "Direct link to Shapes")

`ArrowLoader` returns loaders.gl `ArrowTable` objects by default. Set `arrow.shape` to select another table representation.

| Shape              | Output                                                 |
| ------------------ | ------------------------------------------------------ |
| `arrow-table`      | loaders.gl `ArrowTable` wrapping an Apache Arrow table |
| `columnar-table`   | loaders.gl columnar table                              |
| `array-row-table`  | loaders.gl row table with arrays                       |
| `object-row-table` | loaders.gl row table with objects                      |

## Options[​](#options "Direct link to Options")

| Option                  | Type                                                                           | Default         | Description                                        |
| ----------------------- | ------------------------------------------------------------------------------ | --------------- | -------------------------------------------------- |
| `arrow.shape`           | `'arrow-table' \| 'columnar-table' \| 'array-row-table' \| 'object-row-table'` | `'arrow-table'` | Selects the returned loaders.gl table shape.       |
| `arrow.batchDebounceMs` | `number`                                                                       | `undefined`     | Adds an async delay between emitted Arrow batches. |

## Worker parsing[​](#worker-parsing "Direct link to Worker parsing")

Atomic parsing and `parseInBatches()` support workers with `core.worker: true`. Each batch session retains one Arrow IPC reader, requests input on demand, and waits for the consumer before advancing past an output batch. Batches retain the existing `arrow-table` output shape. Atomic parsing converts to the requested output shape on the caller after hydrating the transferred Arrow data.

Workers return owned Arrow column buffers, preserving dictionaries and extension metadata without transferring buffers still referenced by the reader. Decoded JSON rows and GeoJSON features are never structured-cloned across the worker boundary. Small table and protocol descriptors accompany the buffers. Input chunks can still be large; backpressure does not bound an individual input chunk.

Pass `signal` to cancel a queued or running job. Breaking from iteration closes the input and releases the worker. Iterator cleanup is best effort and does not delay cancellation. Transferred inputs remain detached after cancellation.

Browser workers use the published asset fallback; set `arrow.workerUrl` to self-host the matching worker bundle. Node worker threads require `core._nodeWorkers: true` and use the packaged CommonJS bundle. Set `core.workerInBatches: false` to keep batches on the caller. Custom worker URLs require `core.workerInBatches: true` to declare compatibility with the batch protocol.
