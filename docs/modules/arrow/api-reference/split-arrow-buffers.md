---
title: splitArrowBuffers
description: Make sliced Arrow buffers safe to transfer across workers without copying unrelated bytes.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Arrow buffer utility"
  title="Transfer only the bytes this table owns."
  description="splitArrowBuffers rebuilds Arrow JS objects so typed-array views that point into larger buffers become standalone when necessary. Full-buffer views can still be reused."
  tone="blue"
  meta={['Worker-safe transfer', 'Sliced buffers', 'Arrow JS objects']}
  links={[
    {label: 'Arrow table transport', to: '/docs/modules/arrow/api-reference/arrow-table-transport'},
    {label: 'Worker loaders', to: '/docs/developer-guide/using-worker-loaders'}
  ]}
/>

<DocOrientation
  eyebrow="A precise copy policy"
  title="Copy what needs isolating, and no more."
  description="Use the default sliced-buffer policy for worker transfer, choose no copying when ownership is already controlled, or copy all buffers when a fully independent object is required."
  tone="blue"
  items={[
    {label: 'Default', value: "Copy only views into larger backing buffers"},
    {label: "'none'", value: 'Reuse all typed arrays'},
    {label: "'all'", value: 'Copy every Arrow internal typed array'},
    {label: 'Input', value: 'Arrow tables, record batches, vectors, or data objects'}
  ]}
/>

`splitArrowBuffers` rebuilds Apache Arrow JS objects so sliced internal typed-array buffers are
copied into standalone `ArrayBuffer`s. Internal typed arrays that already span their full backing
`ArrayBuffer` are reused by default.

<ReferenceBoundary
  title="Buffer-splitting details"
  description="The sections below cover usage, supported Arrow object types, copy policies, and the compatibility alias."
  tone="blue"
/>

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
