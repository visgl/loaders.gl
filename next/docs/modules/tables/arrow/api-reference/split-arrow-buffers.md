Arrow buffer utility

![](/next/images/format-logos/apache-arrow-logo.png)

# splitArrowBuffers

splitArrowBuffers rebuilds Arrow JS objects so typed-array views that point into larger buffers become standalone when necessary. Full-buffer views can still be reused.

[Arrow table transport](https://loaders.gl/next/docs/modules/tables/arrow/api-reference/arrow-table-transport.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/arrow/api-reference/arrow-table-transport.md)[Worker loaders](https://loaders.gl/next/docs/developer-guide/using-worker-loaders.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/using-worker-loaders.md)

A precise copy policy

## Copy what needs isolating, and no more.

Use the default sliced-buffer policy for worker transfer, choose no copying when ownership is already controlled, or copy all buffers when a fully independent object is required.

01

Default

Copy only views into larger backing buffers

02

'none'

Reuse all typed arrays

03

'all'

Copy every Arrow internal typed array

04

Input

Arrow tables, record batches, vectors, or data objects

`splitArrowBuffers` rebuilds Apache Arrow JS objects so sliced internal typed-array buffers are copied into standalone `ArrayBuffer`s. Internal typed arrays that already span their full backing `ArrayBuffer` are reused by default.

Detailed guide

## Buffer-splitting details

The sections below cover usage, supported Arrow object types, copy policies, and the compatibility alias.

This is useful before sending Arrow data across a worker boundary. The transferred buffers can be detached without detaching unrelated bytes from a larger shared backing buffer.

## Usage[​](#usage "Direct link to Usage")

```
import {splitArrowBuffers} from '@loaders.gl/tables/arrow/transport';



const transferSafeTable = splitArrowBuffers(table);

worker.postMessage({table: transferSafeTable}, transferList);
```

## API[​](#api "Direct link to API")

```
splitArrowBuffers(input, options);
```

`input` may be an Apache Arrow JS `Table`, `RecordBatch`, `Vector`, or `Data` instance. The return value is a new real Arrow object of the same kind.

`options.copy` controls copying:

| Value      | Behavior                                                                 |
| ---------- | ------------------------------------------------------------------------ |
| `'none'`   | Never copy typed arrays                                                  |
| `'sliced'` | Default. Copy only typed arrays that view a larger backing `ArrayBuffer` |
| `'all'`    | Copy every Arrow internal typed array                                    |

## Compatibility Alias[​](#compatibility-alias "Direct link to Compatibility Alias")

`splitArrowTableBuffers(table, options)` is available as a table-only alias.

## Notes[​](#notes "Direct link to Notes")

`splitArrowBuffers` does not collect transfer lists and does not rehydrate serialized Arrow objects. It only isolates Arrow internal buffers so later transfer-list collection can safely transfer binary data without detaching unrelated memory.

Use `copy: 'none'` only when the sender owns the relevant backing buffers, is done with the source table, no other live data depends on those buffers, and any unrelated bytes in the full backing `ArrayBuffer`s are safe to expose to the receiver.
