---
title: Schema utilities
---

# Schema and table utilities

`@loaders.gl/core/schema-utils` provides table access, schema conversion, batch
construction, and the dispatcher for explicit converter sets.

```bash
npm install @loaders.gl/core
```

| API group | Examples |
| --- | --- |
| Conversion | `convert`, `TableConverter`, `TABLE_CONVERTERS` |
| Schema conversion | `convertArrowToSchema`, `convertSchemaToArrow`, `serializeArrowSchema`, `deserializeArrowSchema` |
| Table access | `getTableLength`, `getTableCell`, `getTableRowAsObject`, `makeRowIterator` |
| Batch construction | `TableBatchBuilder`, `makeTableBatchIterator`, `makeBatchFromTable` |
| Arrow queries | `queryArrowTable`, `selectArrowTableRows` |
| Point authoring | `PointCloudTiler` (bounded additive octree from decoded Mesh/Arrow points) |
| Mesh tables | `convertMeshToTable`, `convertTableToMesh`, `getMeshBoundingBox` |

## Converting table representations

```typescript
import {convert, TABLE_CONVERTERS} from '@loaders.gl/core/schema-utils';

const table = {shape: 'object-row-table', data: [{id: 1, name: 'Alice'}]};
const columns = convert(table, 'columnar-table', [...TABLE_CONVERTERS]);
```

The dispatcher uses the supplied converters to detect the input shape and find
a supported conversion path. It throws when detection is ambiguous or no path
exists. Geometry conversion requires the separate
[GeoArrow converters](/docs/developer-guide/converters/geoarrow-converters).

See [converter usage](/docs/developer-guide/converters/dispatcher) and
[table representations](/docs/specifications/category-table).

See the [dynamic point source reference](/docs/modules/tiles-3d/api-reference/point-cloud-tile-source)
for `PointCloudTiler` ownership, coordinate and memory-limit contracts.

## Arrow wrapper conversion

`convertArrowTable(table, shape)` and `convertArrowTableBatch(batch, shape)` convert
Arrow-backed wrappers to `arrow-table`, `columnar-table`, `object-row-table`, or
`array-row-table`. Import them from `@loaders.gl/core/schema-utils`.

These helpers retain the wrapper's schema and additional metadata. If no schema
is supplied, conversions to other layouts infer it from Arrow. Batch conversion
also retains length, batch type, and progress fields without buffering batches.
Requesting `arrow-table` returns the original wrapper unchanged. Value conversion
uses the existing Arrow conversion semantics; geometry reconstruction is separate.

## Arrow worker transport

Use the dedicated subpath when passing Arrow tables across a worker boundary:

```typescript
import {tableFromArrays} from 'apache-arrow';
import {dehydrateArrowTable, hydrateArrowTable, splitArrowBuffers} from '@math.gl/arrow';

const table = tableFromArrays({value: [1, 2]});
const transferableTable = splitArrowBuffers(table, {copy: 'sliced'});
const payload = dehydrateArrowTable(transferableTable);
const restoredTable = hydrateArrowTable(payload);
```

The payload is structured-cloneable and preserves Arrow schema, vectors, dictionaries,
and record batches. The receiving runtime must use a compatible Apache Arrow version.
The payload contains an IPC **schema-only**
message and separate column buffers, rather than a loaders.gl schema object. Column values
are not encoded into full-table IPC.
`splitArrowBuffers` separates sliced backing buffers; its `copy` option also supports
`'none'` and `'all'`. `serializeArrowWorkerResult` and `deserializeArrowWorkerResult`
from `@loaders.gl/core/arrow-worker-transport` provide loaders.gl worker hooks. Import IPC serialization
helpers and transport types directly from math.gl.

Import transport utilities directly from `@math.gl/arrow`; loaders.gl no longer exposes a
parallel transport utility subpath.

Indexed/mapped Arrow tables, column renaming, and schema validation are also available from
`@math.gl/arrow`; UTF-8 comparison and parsing live in `@math.gl/arrow/utf8`.

## Incremental Arrow metadata

Arrow batch schemas have compatible column names, order, nullability, and types.
Schema and field metadata are snapshots: later batches can refine values without
changing previously emitted batches. Missing keys retain their earlier values;
later values replace earlier values with the same key.

`RecordBatch.metadata` holds batch-local information and is separate from
`RecordBatch.schema.metadata`, which describes the logical table. PLY, OBJ, and
PCD Arrow streams publish cumulative `boundingBox` schema metadata and retain the
current chunk's bounds under `boundingBox` in `RecordBatch.metadata`. LAS bounds
remain the global bounds declared in its header.

A zero-row final batch can carry metadata discovered after the last data rows,
including trailing JSON container properties or LAS extended records. Consumers
must process its schema even though it adds no rows. Empty results retain their
declared schema. JSON container metadata uses `loaders.gl.containerJson`, with
the streamed array replaced by an empty array; Chrome Trace retains its existing
`chromeTrace.*` keys. CRS refinements describe the existing coordinates and do
not reproject them.

```typescript
import {makeArrowTableFromBatches} from '@loaders.gl/core/schema-utils';

// Accepts an Iterable or AsyncIterable of native Apache Arrow RecordBatch objects.
const table = await makeArrowTableFromBatches(recordBatches);
```

The collector merges schema and nested field metadata in emission order, keeps
batch metadata separate, and returns a Table with the completed schema. It rejects
incompatible column structures and returns `null` when the iterator yields no
batches. `makeTableFromBatches` also accepts existing loaders.gl Arrow wrappers.
Loader shape options and wrapper return types are unchanged.

The shared Arrow JS worker transport preserves the Table schema, each batch's
schema, and each batch's custom metadata independently. Older transport payloads
without batch schemas use the Table schema. This contract does not promise that
differing batch schema metadata survives Arrow IPC serialization, nor does it
change schema inference policies for CSV or JSON.
