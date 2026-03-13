# RecordBatch

:::info
This page is aligned to Apache Arrow JS v21.x (`apache-arrow`).
:::

A `RecordBatch` is a fixed-width row set of equal-length child vectors.

## Overview

Use `table.batches[i]` from a `Table`, or deserialize IPC input to get `RecordBatch` instances.

```ts
import {Table, Field, Int32, Utf8, makeTable} from 'apache-arrow';

const table = makeTable({
  id: [1, 2, 3],
  label: ['a', 'b', 'c']
});

const batch = table.batches[0];
```

## Usage

```ts
import {makeTable, Field, Int32, Utf8} from 'apache-arrow';

const table = makeTable({
  id: [1, 2, 3],
  label: ['a', 'b', 'c']
});
const batch = table.batches[0];
console.log(batch?.numRows, batch?.schema?.length);
```

```ts
import {makeVector, Struct, Field, Int32, Utf8} from 'apache-arrow';

const batch = makeTable({
  id: [1, 2],
  label: ['x', 'y']
}).batches[0];
for (const row of batch) {
  console.log(row.id, row.label);
}
```

## Constructors

`new RecordBatch<T extends TypeMap = any>(columns: { [P in keyof T]: Data<T[P]> })`

`new RecordBatch<T extends TypeMap = any>(schema: Schema<T>, data?: Data<Struct<T>>)`.  
Build a record batch from a schema and backing struct data.

## Members

### `schema: Schema` (readonly)

Batch schema.

### `data: Data<Struct>` (readonly)

Flattened row-major backing data.

### `numCols: number` (readonly)

Number of columns.

### `numRows: number` (readonly)

Number of rows.

### `nullCount: number` (readonly)

Number of null rows.

## Methods

### `isValid(index: number): boolean`

Returns whether row at `index` is non-null.

### `get(index: number): StructRowProxy<T> | null`

Returns row data at `index`.

### `at(index: number): StructRowProxy<T> | null`

Returns row data at `index`, with negative indexes counting from the end.

### `set(index: number, value: Struct<T>['TValue']): void`

Assigns one row value at `index`.

### `indexOf(element: Struct<T>['TValue'], offset?: number): number`

Finds the first row matching `element`.

### `[Symbol.iterator](): IterableIterator<StructRowProxy<T>>`

Iterates rows in row order.

### `toArray(): StructRowProxy<T>[]`

Converts all rows into a JS array.

### `toString(): string`

Returns a human-readable row dump.

### `concat(...others: RecordBatch<T>[]): Table<T>`

Returns a single table by concatenating same-schema record batches.

### `slice(begin?: number, end?: number): RecordBatch<T>`

Returns a row-range view, end-exclusive.

### `getChild(name: keyof T): Vector | null`

Returns child vector by field name.

### `getChildAt(index: number): Vector | null`

Returns child vector by field position.

### `setChild(name: keyof T, child: Vector): RecordBatch`

Returns a new batch with a named child replaced.

### `setChildAt(index: number, child?: Vector | null): RecordBatch`

Returns a new batch with a child replaced at index.

### `select<K extends keyof T = any>(columnNames: K[]): RecordBatch<{ [P in K]: T[P] }>`

Returns a new batch with only selected names.

### `selectAt<K extends T = any>(columnIndices: number[]): RecordBatch<{ [P in keyof K]: K[P] }>`

Returns a new batch with only selected indexes.
