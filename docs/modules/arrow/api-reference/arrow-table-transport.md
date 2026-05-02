# Arrow Table Transport

`@loaders.gl/arrow/transport` provides focused Arrow table transport helpers for worker
boundaries. The same helpers are also available from the `@loaders.gl/arrow` root export for
compatibility, but worker-aware modules should prefer the transport subpath.

Use `dehydrateArrowTable` / `hydrateArrowTable` when both sides are known to use compatible Apache
Arrow JS object layouts and the receiver should continue working with a separated Arrow table. Use
the Arrow IPC serialize/deserialize path when crossing package-version boundaries or when
compatibility is unknown.

Apache Arrow JS does not expose a public npm package version constant. `MetadataVersion` is the IPC
metadata format version, not the Arrow JS library version, so loaders.gl does not auto-select the
transport from an Arrow version export.

## Separated Arrow JS Payload

`dehydrateArrowTable(table)` prepares a table for structured clone. It rebuilds the table with
isolated buffers before creating the payload:

- Typed arrays that already span their full backing `ArrayBuffer` are reused.
- Typed arrays that are slices/views into a larger `ArrayBuffer` are copied into fresh standalone
  buffers.
- Schema and type metadata are serialized into plain loaders.gl schema objects so structured clone
  does not rely on preserving Arrow JS class prototypes.
- Schema and type metadata use the loaders.gl schema utility helpers `serializeArrowSchema`,
  `deserializeArrowSchema`, `serializeArrowType`, and `deserializeArrowType` from
  `@loaders.gl/schema-utils`.

`hydrateArrowTable(payload)` rebuilds a real Apache Arrow JS `Table` from that payload. The hydrated
table is useful for further Arrow JS work in the receiving thread, including slicing, dropping
columns, retaining columns independently, or transferring the table again without detaching unrelated
memory.

```ts
import {dehydrateArrowTable, hydrateArrowTable} from '@loaders.gl/arrow/transport';

const payload = dehydrateArrowTable(table);
worker.postMessage(payload, transferList);

const table = hydrateArrowTable(payload);
```

### `dehydrateArrowTable`

```ts
dehydrateArrowTable(table, options);
```

Parameters:

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| `table` | `arrow.Table` | Arrow table to dehydrate. |
| `options.copy` | `'none' \| 'sliced' \| 'all'` | Defaults to `'sliced'`. Use `'none'` to skip buffer copying, or `'all'` to copy every Arrow internal typed array. |

Returns a structured-cloneable `DehydratedArrowTable`:

```ts
type DehydratedArrowTable = {
  shape: 'arrow-table';
  transport: 'arrow-js';
  schema: Schema;
  batches: DehydratedArrowRecordBatch[];
};
```

### `hydrateArrowTable`

```ts
hydrateArrowTable(payload);
```

Parameters:

| Parameter | Type | Description |
| --------- | ---- | ----------- |
| `payload` | `DehydratedArrowTable` | Payload returned by `dehydrateArrowTable`. |

Returns a real `arrow.Table`.

This path avoids Arrow IPC encoding work and returns a separated table for further manipulation, but
it still depends on compatible Apache Arrow JS internals on both sides.

### Ownership Considerations

The default `options.copy: 'sliced'` is conservative. It copies only typed-array views that point
into a larger backing `ArrayBuffer`, so later transfer-list collection does not detach unrelated
memory.

Use `copy: 'none'` only when all of these are true:

- The sender owns the relevant backing `ArrayBuffer`s.
- The sender is done using the source table after transfer.
- No other live table, column, vector, or application object depends on those backing buffers.
- Transferring or cloning the full backing `ArrayBuffer`s is acceptable, even if a column only uses a
  subrange of each buffer.
- Any unrelated bytes in those backing buffers are safe to expose to the receiving thread.

When an `ArrayBuffer` is transferred, the sender-side buffer is detached. This includes the entire
backing buffer, not just the typed-array view that Arrow is using. If there is any uncertainty about
ownership or unrelated bytes, keep the default `copy: 'sliced'`.

## Robust Arrow IPC Payload

```ts
import {
  serializeArrowTableToIPC,
  deserializeArrowTableFromIPC
} from '@loaders.gl/arrow/transport';

const payload = serializeArrowTableToIPC(table);
worker.postMessage(payload, [payload.data.buffer]);

const table = deserializeArrowTableFromIPC(payload);
```

`serializeArrowTableToIPC(table)` returns Arrow IPC bytes.
`deserializeArrowTableFromIPC(payload)` accepts the payload object, a `Uint8Array`, or an
`ArrayBuffer`.

This path does more copying and encoding work, but it is the safer choice when the app and worker may
load different Apache Arrow JS versions.
