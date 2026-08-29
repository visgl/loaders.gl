---
title: Row
description: Access one record from a table, record batch, or structured Arrow vector.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Arrow JS API · row access"
  title="Inspect one row without rebuilding the table."
  description="Row values are the row-level view returned by Table, RecordBatch, and Struct vectors. Use names or indexes for inspection, then convert explicitly when a plain object or array is needed."
  tone="blue"
  meta={['Named and indexed access', 'Struct rows', 'JSON and array conversion']}
  links={[
    {label: 'Table', to: '/docs/arrowjs/api-reference/table'},
    {label: 'RecordBatch', to: '/docs/arrowjs/api-reference/record-batch'},
    {label: 'Vector', to: '/docs/arrowjs/api-reference/vector'}
  ]}
/>

<DocOrientation
  eyebrow="The Row model"
  title="Use a row for inspection, not as the storage model."
  description="Arrow stores columns and batches, then provides a row proxy when application code needs record-shaped access. Keep column operations columnar and materialize rows only at a boundary that needs them."
  tone="blue"
  items={[
    {label: 'Access', value: 'Index or field name'},
    {label: 'Iteration', value: 'Entries through the row iterator'},
    {label: 'Conversion', value: 'toArray, toJSON, and toString'},
    {label: 'Source', value: 'Table rows, RecordBatch rows, or Struct vectors'}
  ]}
/>

<ReferenceBoundary
  title="Row and StructRow reference"
  description="The sections below document row methods, iteration, field access, and the relationship between row proxies and columnar storage."
  tone="blue"
/>

:::info
This page is aligned to Apache Arrow JS v21.x (`apache-arrow`).
:::

A `Row` is the row-level object returned by nested `Struct` vectors and by `Table`/`RecordBatch` row access. Rows behave like read-only tuples keyed by index and field name.

## Usage

```ts
import {makeVector, Struct, Field, Int32, Utf8} from 'apache-arrow';

const rows = makeVector(
  [
    {id: 1, value: 'foo'},
    {id: 2, value: 'bar'}
  ],
  new Struct([new Field('id', new Int32()), new Field('value', new Utf8())])
);

const row = rows.get(0);
console.log(row?.[0], row?.id, row?.value);
```

```ts
import {makeVector, Struct, Field, Utf8, Int32} from 'apache-arrow';

const names = makeVector(
  [
    {id: 1, name: 'Alice'},
    {id: 2, name: 'Bob'}
  ],
  new Struct([new Field('id', new Int32()), new Field('name', new Utf8())])
);

for (const row of names) {
  console.log(row.id, row.size, row.toString());
}
```

## StructRow API

## Methods

- `toArray(): T[string]["TValue"][]` — Materializes row fields to a plain array.
- `toJSON(): { [P in string & keyof T]: T[P]["TValue"]; }` — Returns row values as a JSON object.
- `toString(): string` — Returns a debug string.
- `[Symbol.iterator](): IterableIterator<[keyof T, T[keyof T]['TValue'] | null]>` — Iterates `[key, value]` entries.
- `size: number` — Number of fields in the row.

Rows can also be used directly in `for...of`, bracket access, and property-style access.
