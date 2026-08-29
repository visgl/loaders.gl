---
title: Table
description: Work with chunked, typed columns as one logical Apache Arrow table.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Arrow JS API · container"
  title="The table is the application-facing container."
  description="Table combines one or more record-batch chunks into a logical set of named, typed columns. Use it for ordinary multi-column Arrow data, then choose rows, vectors, or batches for the next operation."
  tone="cyan"
  meta={['Chunked columns', 'Rows and vectors', 'Apache Arrow JS v21+']}
  links={[
    {label: 'Arrow JS guide', to: '/docs/arrowjs'},
    {label: 'RecordBatch', to: '/docs/arrowjs/api-reference/record-batch'},
    {label: 'Vector', to: '/docs/arrowjs/api-reference/vector'}
  ]}
/>

<DocOrientation
  eyebrow="The Table model"
  title="One logical table, many physical batches."
  description="A Table keeps the schema and row count stable while allowing data to arrive or remain stored in record-batch chunks. This is the useful boundary between IPC, loaders, scans, and application code."
  tone="cyan"
  items={[
    {label: 'Schema', value: 'Names and types shared by the table columns'},
    {label: 'Batches', value: 'Row-aligned RecordBatch chunks'},
    {label: 'Access', value: 'Rows, child vectors, slices, and iteration'},
    {label: 'Scale', value: 'Chunking without changing the logical table shape'}
  ]}
/>

<ReferenceBoundary
  title="Table reference"
  description="The sections below document construction, members, row and column access, slicing, iteration, and serialization-related behavior."
  tone="cyan"
/>

:::info
This page is aligned to Apache Arrow JS v21.x (`apache-arrow`).
:::

A logical table as a sequence of record-batch chunks.

## Overview

`Table` is the row-oriented container in Arrow JS and the recommended way to handle multi-column, multi-row Arrow data in memory.

## Usage

```ts
import {makeTable, tableFromArrays, Table} from 'apache-arrow';

const table = makeTable({
  a: new Int32Array([1, 2, 3]),
  b: ['x', 'y', 'z']
});

const fromArrays = tableFromArrays({
  a: [1, 2, 3],
  b: ['x', 'y', 'z']
});

console.log(Table !== undefined, table.numRows, table.numCols);
```

## Members

### `schema: Schema` (readonly)

Table schema.

### `batches: RecordBatch[]` (readonly)

List of logical table chunks.

### `data: Data<Struct>[]` (readonly)

Convenience getter for backing `Data` chunks.

### `numCols: number` (readonly)

Number of columns.

### `numRows: number` (readonly)

Total row count across chunks.

### `nullCount: number` (readonly)

Total number of null rows.

## Constructors

`Table` has multiple constructor forms.

- `new Table()`
- `new Table(...batches: RecordBatch[])`
- `new Table(...columns: Vector[])`
- `new Table(schema: Schema, ...columns: Vector[])`
- `new Table(schema: Schema, data?: RecordBatch | RecordBatch[])`

Use `makeTable` for typed array convenience and `tableFromArrays` for mixed JS arrays + typed arrays.

## Methods

### `isValid(index: number): boolean`

Returns whether row at `index` is non-null.

### `get(index: number): Struct<T> | null`

Returns the row value at `index`.

### `at(index: number): Struct<T> | null`

Returns the row value at `index`, supporting negative indexes.

### `set(index: number, value: Struct<T>['TValue'] | null): void`

Writes a row value at `index`.

### `indexOf(element: Struct<T>, offset?: number): number`

Finds the first row equal to `element`, starting from optional `offset`.

### `[Symbol.iterator](): IterableIterator<any>`

Iterates table rows.

### `toArray(): any[]`

Converts rows to a standard array.

### `toString(): string`

Returns a string summary for debugging.

### `concat(...others: Table<T>[]): Table<T>`

Concatenates same-schema tables and returns a new table.

### `slice(begin?: number, end?: number): Table<T>`

Returns a zero-copy row slice using `[begin, end)`.

### `getChild(name: keyof T): Vector | null`

Gets a child vector by name.

### `getChildAt(index: number): Vector | null`

Gets a child vector by index.

### `setChild(name: keyof T, child: Vector): Table`

Returns a new table with the named child replaced.

### `setChildAt(index: number, child?: Vector | null): Table`

Returns a new table with child vector at `index` replaced.

### `select<K extends keyof T = any>(columnNames: K[]): Table<{ [P in K]: T[P] }>`

Returns a table including only selected column names.

### `selectAt<K extends T = any>(columnIndices: number[]): Table<{ [P in keyof K]: K[P] }>`

Returns a table including only selected column indices.

### `assign<R extends TypeMap = any>(other: Table<R>): Table<T & R>`

Returns a merged schema/data table with `other` appended row-wise.

## Notes

- The `Table` API no longer exposes `count` or `countBy` methods in v21.
- Legacy `getColumn` / `getColumnAt` and `length`-only helpers are replaced by `getChild`/`getChildAt` and `numRows`.
