---
title: Data
description: Understand the typed, chunk-level storage that backs an Apache Arrow Vector.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Arrow JS API · storage"
  title="Data is the chunk underneath a Vector."
  description="Data holds the typed values, validity information, offsets, and child storage for one contiguous logical segment. Most applications use Vector and Table directly; this page is for custom readers, builders, and low-level inspection."
  tone="violet"
  meta={['Chunk-level storage', 'Buffers and offsets', 'Low-level API']}
  links={[
    {label: 'Vector', to: '/docs/arrowjs/api-reference/vector'},
    {label: 'Builder', to: '/docs/arrowjs/api-reference/builder'},
    {label: 'Arrow JS reference', to: '/docs/arrowjs/api-reference'}
  ]}
/>

<DocOrientation
  eyebrow="The Data model"
  title="Keep physical buffers behind a logical column."
  description="Data describes one chunk, including its type, length, offset, stride, validity, values, and nested children. Vector composes these chunks into the column interface used by tables and record batches."
  tone="violet"
  items={[
    {label: 'Values', value: 'Primary typed data buffer'},
    {label: 'Validity', value: 'Null bitmap and null count metadata'},
    {label: 'Structure', value: 'Offsets, type ids, children, and dictionaries'},
    {label: 'Consumer', value: 'Vector and nested Arrow data types'}
  ]}
/>

<ReferenceBoundary
  title="Data storage reference"
  description="The sections below document members, buffer roles, slicing, validity, nested children, dictionaries, and low-level construction."
  tone="violet"
/>

:::info
This page is aligned to Apache Arrow JS v21.x (`apache-arrow`).
:::

Untyped storage backing for `Vector`.

Think of `Data` as a chunk: typed arrays and metadata for one contiguous segment.

## Usage

```ts
import {makeData, Int32} from 'apache-arrow';

const data = makeData({
  type: new Int32(),
  data: new Int32Array([1, 2, 3]),
  length: 3,
  nullCount: 0
});
```

```ts
import {makeData, Int32} from 'apache-arrow';

const data = makeData({type: new Int32(), length: 2, nullCount: 0, data: new Int32Array([1, 2])});
const copy = data.slice(0, 1);
console.log(copy.length, copy.getValid(0));
```

## Members

### `type: T`

The logical `DataType`.

### `length: number`

Number of logical elements.

### `offset: number`

Logical offset into the underlying buffers.

### `stride: number`

Elements per logical slot.

### `children: Data[]`

Nested child data.

### `dictionary?: Vector`

Optional dictionary backing (for `Dictionary` type only).

### `values: TBuffer[BufferType.DATA]`

Primary values buffer.

### `typeIds: TBuffer[BufferType.TYPE]`

Dictionary/union type id buffer.

### `nullBitmap: TBuffer[BufferType.VALIDITY]`

Validity bitmask.

### `valueOffsets: TBuffer[BufferType.OFFSET]`

Offset buffers for variable-width types.

### `ArrayType: T['ArrayType']`

Physical JS typed array constructor.

### `typeId: T['TType']`

Underlying type enum id.

### `buffers: Buffers<T>`

Named tuple view of data buffers.

### `nullable: boolean`

Whether the element type can represent null.

### `byteLength: number`

Byte size across buffers.

### `nullCount: number`

Computed number of null rows.

## Factory usage

`Data` objects are created via `makeData()` in the `apache-arrow` exports.

## Methods

### `constructor(type: T, offset: number, length: number, nullCount?: number, buffers?: Partial<Buffers<T>> | Data<T>, children?: Data[], dictionary?: Vector)`

Low-level constructor used for manual `Data` assembly and advanced integrations.

### `getValid(index: number): boolean`

Returns whether element is non-null.

### `setValid(index: number, value: boolean): boolean`

Set nullability state for one element.

### `clone<R extends DataType = T>(type?: R, offset?: number, length?: number, nullCount?: number, buffers?: Buffers<R>, children?: Data[]): Data<R>`

Clone and optionally override metadata.

### `slice(offset: number, length: number): Data<T>`

Create a sliced data instance.
