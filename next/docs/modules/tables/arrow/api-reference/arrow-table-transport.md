Arrow worker transport

[![](/next/images/format-logos/apache-arrow-logo.png)](https://loaders.gl/next/docs/modules/tables/arrow/formats/arrow.md)

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

`@math.gl/core/arrow` provides focused Arrow table transport helpers for worker boundaries. The same helpers are also available from the `@loaders.gl/tables/arrow` root export for compatibility, but worker-aware modules should prefer the transport subpath.

Detailed guide

## Transport and buffer details

The sections below compare separated Arrow payloads with IPC, and document schema, buffer, and compatibility behavior.

Use `dehydrateArrowTable` / `hydrateArrowTable` when both sides are known to use compatible Apache Arrow JS object layouts and the receiver should continue working with a separated Arrow table. Use the Arrow IPC serialize/deserialize path when crossing package-version boundaries or when compatibility is unknown.

Apache Arrow JS does not expose a public npm package version constant. `MetadataVersion` is the IPC metadata format version, not the Arrow JS library version, so loaders.gl does not auto-select the transport from an Arrow version export.

## Separated Arrow JS Payload[​](#separated-arrow-js-payload "Direct link to Separated Arrow JS Payload")

`dehydrateArrowTable(table)` prepares a table for structured clone. It rebuilds the table with isolated buffers before creating the payload:

* Typed arrays that already span their full backing `ArrayBuffer` are reused.
* Typed arrays that are slices/views into a larger `ArrayBuffer` are copied into fresh standalone buffers.
* Schema and type metadata are encoded by `@math.gl/core/arrow` into a schema-only IPC message, preserving Arrow JS types without relying on class prototypes or a parallel schema serializer.

`hydrateArrowTable(payload)` rebuilds a real Apache Arrow JS `Table` from that payload. The hydrated table is useful for further Arrow JS work in the receiving thread, including slicing, dropping columns, retaining columns independently, or transferring the table again without detaching unrelated memory.

```
import {dehydrateArrowTable, hydrateArrowTable} from '@math.gl/core/arrow';



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

  transport: 'arrow-js';

  version: 1;

  schema: Uint8Array; // Schema-only Arrow IPC message.

  metadataVersion: MetadataVersion;

  batches: DehydratedArrowData[];

};
```

`@math.gl/core/arrow` owns this payload and its buffer handling. The table values remain separate column buffers; only the schema is IPC-encoded. Loader worker result hooks in `@loaders.gl/core/arrow-worker-transport` add the outer `shape` discriminator. Payloads are version-coupled worker messages, not a persisted file format.

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

} from '@math.gl/core/arrow';



const payload = serializeArrowTableToIPC(table);

worker.postMessage(payload, [payload.data.buffer]);



const restoredTable = deserializeArrowTableFromIPC(payload);
```

`serializeArrowTableToIPC(table)` returns Arrow IPC bytes. `deserializeArrowTableFromIPC(payload)` accepts the payload object, a `Uint8Array`, or an `ArrayBuffer`.

This path does more copying and encoding work, but it is the safer choice when the app and worker may load different Apache Arrow JS versions.

## Owned worker column buffers[​](#owned-worker-column-buffers "Direct link to Owned worker column buffers")

`serializeNativeArrowWorkerResult(value)` and `deserializeNativeArrowWorkerResult(payload)` from `@loaders.gl/core/arrow-worker-transport` transfer native Apache Arrow `Table` and `RecordBatch` values. Column buffers are transferred directly. The payload includes the table schema, each batch's own schema, and batch-local metadata.

The native serializer copies all outgoing buffers by default, including dictionaries retained by a parser. Identical typed-array views within one message reuse a single copy. Applications that own the backing buffers can choose an explicit copy mode.

Built-in workers use this column transport for Arrow results. Where a loader also supports row, GeoJSON, or mesh output, it can reconstruct those values after hydration.
