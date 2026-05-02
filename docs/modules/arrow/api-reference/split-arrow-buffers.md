# splitArrowBuffers

`splitArrowBuffers` rebuilds Apache Arrow JS objects so sliced internal typed-array buffers are
copied into standalone `ArrayBuffer`s. Internal typed arrays that already span their full backing
`ArrayBuffer` are reused by default.

This is useful before sending Arrow data across a worker boundary. The transferred buffers can be
detached without detaching unrelated bytes from a larger shared backing buffer.

## Usage

```ts
import {splitArrowBuffers} from '@loaders.gl/arrow/transport';

const transferSafeTable = splitArrowBuffers(table);
worker.postMessage({table: transferSafeTable}, transferList);
```

## API

```ts
splitArrowBuffers(input, options);
```

`input` may be an Apache Arrow JS `Table`, `RecordBatch`, `Vector`, or `Data` instance. The return
value is a new real Arrow object of the same kind.

`options.copy` controls copying:

| Value      | Behavior                                                                 |
| ---------- | ------------------------------------------------------------------------ |
| `'none'`   | Never copy typed arrays                                                  |
| `'sliced'` | Default. Copy only typed arrays that view a larger backing `ArrayBuffer` |
| `'all'`    | Copy every Arrow internal typed array                                    |

## Compatibility Alias

`splitArrowTableBuffers(table, options)` is available as a table-only alias.

## Notes

`splitArrowBuffers` does not collect transfer lists and does not rehydrate serialized Arrow objects.
It only isolates Arrow internal buffers so later transfer-list collection can safely transfer binary
data without detaching unrelated memory.

Use `copy: 'none'` only when the sender owns the relevant backing buffers, is done with the source
table, no other live data depends on those buffers, and any unrelated bytes in the full backing
`ArrayBuffer`s are safe to expose to the receiver.
