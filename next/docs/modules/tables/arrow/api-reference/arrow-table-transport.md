Arrow worker transport

![](/next/images/format-logos/apache-arrow-logo.png)

# Arrow table transport

The transport helpers prepare Arrow tables for structured clone or IPC transfer. They make sliced buffers safe to transfer and keep the schema explicit when data crosses a worker boundary.

[Worker loaders](https://loaders.gl/next/docs/developer-guide/using-worker-loaders.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/using-worker-loaders.md)[Arrow format](https://loaders.gl/next/docs/modules/tables/arrow/formats/arrow.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/arrow/formats/arrow.md)

The transport choice

## Use the smallest boundary that stays correct.

Dehydrate and hydrate when both sides share compatible Arrow JS layouts. Use IPC serialization when the receiver may use a different package version or runtime.

01

Dehydrate

Prepare a table and isolate sliced typed-array buffers

02

Hydrate

Rebuild a real Arrow JS table on the receiving side

03

IPC

Use serialized Arrow bytes across compatibility boundaries

04

Preserves

Schema, types, columns, and table-level structure

`@loaders.gl/tables/arrow/transport` provides focused Arrow table transport helpers for worker boundaries. The same helpers are also available from the `@loaders.gl/tables/arrow` root export for compatibility, but worker-aware modules should prefer the transport subpath.

Detailed guide

## Transport and buffer details

The sections below compare separated Arrow payloads with IPC, and document schema, buffer, and compatibility behavior.

Use `dehydrateArrowTable` / `hydrateArrowTable` when both sides are known to use compatible Apache Arrow JS object layouts and the receiver should continue working with a separated Arrow table. Use the Arrow IPC serialize/deserialize path when crossing package-version boundaries or when compatibility is unknown.

Apache Arrow JS does not expose a public npm package version constant. `MetadataVersion` is the IPC metadata format version, not the Arrow JS library version, so loaders.gl does not auto-select the transport from an Arrow version export.

## Separated Arrow JS Payload[​](#separated-arrow-js-payload "Direct link to Separated Arrow JS Payload")

`dehydrateArrowTable(table)` prepares a table for structured clone. It rebuilds the table with isolated buffers before creating the payload:

* Typed arrays that already span their full backing `ArrayBuffer` are reused.
* Typed arrays that are slices/views into a larger `ArrayBuffer` are copied into fresh standalone buffers.
* Schema and type metadata are serialized into plain loaders.gl schema objects so structured clone does not rely on preserving Arrow JS class prototypes.
* Schema and type metadata use the loaders.gl schema utility helpers `serializeArrowSchema`, `deserializeArrowSchema`, `serializeArrowType`, and `deserializeArrowType` from `@loaders.gl/core/schema-utils`.

`hydrateArrowTable(payload)` rebuilds a real Apache Arrow JS `Table` from that payload. The hydrated table is useful for further Arrow JS work in the receiving thread, including slicing, dropping columns, retaining columns independently, or transferring the table again without detaching unrelated memory.

```
import {dehydrateArrowTable, hydrateArrowTable} from '@loaders.gl/tables/arrow/transport';



const payload = dehydrateArrowTable(table);

worker.postMessage(payload, transferList);



const hydratedTable = hydrateArrowTable(payload);
```

### `dehydrateArrowTable`[​](#dehydratearrowtable "Direct link to dehydratearrowtable")

```
dehydrateArrowTable(table, options);
```

Parameters:

| Parameter      | Type                          | Description                                                                                                       |
| -------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `table`        | `arrow.Table`                 | Arrow table to dehydrate.                                                                                         |
| `options.copy` | `'none' \| 'sliced' \| 'all'` | Defaults to `'sliced'`. Use `'none'` to skip buffer copying, or `'all'` to copy every Arrow internal typed array. |

Returns a structured-cloneable `DehydratedArrowTable`:

```
type DehydratedArrowTable = {

  shape: 'arrow-table';

  transport: 'arrow-js';

  schema: Schema;

  batches: DehydratedArrowRecordBatch[];

};
```

### `hydrateArrowTable`[​](#hydratearrowtable "Direct link to hydratearrowtable")

```
hydrateArrowTable(payload);
```

Parameters:

| Parameter | Type                   | Description                                |
| --------- | ---------------------- | ------------------------------------------ |
| `payload` | `DehydratedArrowTable` | Payload returned by `dehydrateArrowTable`. |

Returns a real `arrow.Table`.

This path avoids Arrow IPC encoding work and returns a separated table for further manipulation, but it still depends on compatible Apache Arrow JS internals on both sides.

### Ownership Considerations[​](#ownership-considerations "Direct link to Ownership Considerations")

The default `options.copy: 'sliced'` is conservative. It copies only typed-array views that point into a larger backing `ArrayBuffer`, so later transfer-list collection does not detach unrelated memory.

Use `copy: 'none'` only when all of these are true:

* The sender owns the relevant backing `ArrayBuffer`s.
* The sender is done using the source table after transfer.
* No other live table, column, vector, or application object depends on those backing buffers.
* Transferring or cloning the full backing `ArrayBuffer`s is acceptable, even if a column only uses a subrange of each buffer.
* Any unrelated bytes in those backing buffers are safe to expose to the receiving thread.

When an `ArrayBuffer` is transferred, the sender-side buffer is detached. This includes the entire backing buffer, not just the typed-array view that Arrow is using. If there is any uncertainty about ownership or unrelated bytes, keep the default `copy: 'sliced'`.

## Robust Arrow IPC Payload[​](#robust-arrow-ipc-payload "Direct link to Robust Arrow IPC Payload")

```
import {

  serializeArrowTableToIPC,

  deserializeArrowTableFromIPC

} from '@loaders.gl/tables/arrow/transport';



const payload = serializeArrowTableToIPC(table);

worker.postMessage(payload, [payload.data.buffer]);



const restoredTable = deserializeArrowTableFromIPC(payload);
```

`serializeArrowTableToIPC(table)` returns Arrow IPC bytes. `deserializeArrowTableFromIPC(payload)` accepts the payload object, a `Uint8Array`, or an `ArrayBuffer`.

This path does more copying and encoding work, but it is the safer choice when the app and worker may load different Apache Arrow JS versions.

## Owned worker column buffers[​](#owned-worker-column-buffers "Direct link to Owned worker column buffers")

`serializeArrowWorkerTable(result)` and `deserializeArrowWorkerTable(result)` from `@loaders.gl/core/schema-utils/arrow-transport` transfer Arrow table and batch columns directly. The serializer uses `dehydrateArrowTable(table, {copy: 'all'})`; the receiver uses `hydrateArrowTable`. The worker protocol does not encode or decode Arrow IPC.

Every outgoing buffer is owned by the message, including dictionaries retained by a parser and separate mesh indices. Identical typed-array views referenced within one Arrow object reuse a single copy. This is a safe-copy transport, not a promise of zero-copy handoff from the parser. Small schema and batch descriptors accompany the transferable buffers.

Built-in CSV, Parquet, Arrow, GeoArrow, JSONTable/NDJSON Arrow output, OBJ, PLY, and PCD workers use this shared path for atomic results and batches. Requested rows, GeoJSON features, and legacy meshes are materialized on the caller. Non-Arrow JSON uses binary JSON transport and caller-side decoding. Worker deserializers reject IPC and raw decoded-object payloads; custom workers must use the current wire format.

These owned worker serializers always copy retained storage, regardless of `core.workerTransferBufferCopy`. The lower-level splitter and generic transport helpers retain explicit copy modes for applications that can establish exclusive buffer ownership.
