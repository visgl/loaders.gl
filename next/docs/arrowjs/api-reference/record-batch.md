Arrow JS API · batch container

# A RecordBatch is one useful chunk of a table.

RecordBatch groups equal-length child vectors under one schema. It is the unit that IPC readers, streaming loaders, and incremental processing pipelines can pass around without materializing an entire table.

[Table](https://loaders.gl/next/docs/arrowjs/api-reference/table.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs/api-reference/table.md)[Vector](https://loaders.gl/next/docs/arrowjs/api-reference/vector.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs/api-reference/vector.md)[Working with tables](https://loaders.gl/next/docs/arrowjs/developer-guide/tables.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs/developer-guide/tables.md)

The RecordBatch model

## Keep rows aligned while data arrives in chunks.

Every child vector in a RecordBatch has the same logical length. Pass batches through a stream, inspect rows, or combine them into a Table when a complete logical result is useful.

01

Rows

Equal-length records across all child vectors

02

Columns

Typed Vector children under one Schema

03

Source

Table chunks or IPC readers

04

Next step

Process immediately or append to a Table

Detailed guide

## RecordBatch reference

The sections below document constructors, schema and data members, child access, row iteration, and chunk behavior.

info

This page is aligned to Apache Arrow JS v21.x (`apache-arrow`).

A `RecordBatch` is a fixed-width row set of equal-length child vectors.

## Overview[​](#overview "Direct link to Overview")

Use `table.batches[i]` from a `Table`, or deserialize IPC input to get `RecordBatch` instances.

```
import {Table, Field, Int32, Utf8, tableFromArrays} from 'apache-arrow';



const table = tableFromArrays({

  id: [1, 2, 3],

  label: ['a', 'b', 'c']

});



const batch = table.batches[0];
```

## Usage[​](#usage "Direct link to Usage")

```
import {tableFromArrays, Field, Int32, Utf8} from 'apache-arrow';



const table = tableFromArrays({

  id: [1, 2, 3],

  label: ['a', 'b', 'c']

});

const batch = table.batches[0];

console.log(batch?.numRows, batch?.schema?.fields.length);
```

```
import {tableFromArrays} from 'apache-arrow';



const batch = tableFromArrays({

  id: [1, 2],

  label: ['x', 'y']

}).batches[0];

for (const row of batch) {

  console.log(row.id, row.label);

}
```

## Constructors[​](#constructors "Direct link to Constructors")

`new RecordBatch<T extends TypeMap = any>(columns: { [P in keyof T]: Data<T[P]> })`

`new RecordBatch<T extends TypeMap = any>(schema: Schema<T>, data?: Data<Struct<T>>)`.<br /><!-- -->Build a record batch from a schema and backing struct data.

## Members[​](#members "Direct link to Members")

### `schema: Schema` (readonly)[​](#schema-schema-readonly "Direct link to schema-schema-readonly")

Batch schema.

### `data: Data<Struct>` (readonly)[​](#data-datastruct-readonly "Direct link to data-datastruct-readonly")

Flattened row-major backing data.

### `numCols: number` (readonly)[​](#numcols-number-readonly "Direct link to numcols-number-readonly")

Number of columns.

### `numRows: number` (readonly)[​](#numrows-number-readonly "Direct link to numrows-number-readonly")

Number of rows.

### `nullCount: number` (readonly)[​](#nullcount-number-readonly "Direct link to nullcount-number-readonly")

Number of null rows.

## Methods[​](#methods "Direct link to Methods")

### `isValid(index: number): boolean`[​](#isvalidindex-number-boolean "Direct link to isvalidindex-number-boolean")

Returns whether row at `index` is non-null.

### `get(index: number): StructRowProxy<T> | null`[​](#getindex-number-structrowproxyt--null "Direct link to getindex-number-structrowproxyt--null")

Returns row data at `index`.

### `at(index: number): StructRowProxy<T> | null`[​](#atindex-number-structrowproxyt--null "Direct link to atindex-number-structrowproxyt--null")

Returns row data at `index`, with negative indexes counting from the end.

### `set(index: number, value: Struct<T>['TValue']): void`[​](#setindex-number-value-structttvalue-void "Direct link to setindex-number-value-structttvalue-void")

Assigns one row value at `index`.

### `indexOf(element: Struct<T>['TValue'], offset?: number): number`[​](#indexofelement-structttvalue-offset-number-number "Direct link to indexofelement-structttvalue-offset-number-number")

Finds the first row matching `element`.

### `[Symbol.iterator](): IterableIterator<StructRowProxy<T>>`[​](#symboliterator-iterableiteratorstructrowproxyt "Direct link to symboliterator-iterableiteratorstructrowproxyt")

Iterates rows in row order.

### `toArray(): StructRowProxy<T>[]`[​](#toarray-structrowproxyt "Direct link to toarray-structrowproxyt")

Converts all rows into a JS array.

### `toString(): string`[​](#tostring-string "Direct link to tostring-string")

Returns a human-readable row dump.

### `concat(...others: RecordBatch<T>[]): Table<T>`[​](#concatothers-recordbatcht-tablet "Direct link to concatothers-recordbatcht-tablet")

Returns a single table by concatenating same-schema record batches.

### `slice(begin?: number, end?: number): RecordBatch<T>`[​](#slicebegin-number-end-number-recordbatcht "Direct link to slicebegin-number-end-number-recordbatcht")

Returns a row-range view, end-exclusive.

### `getChild(name: keyof T): Vector | null`[​](#getchildname-keyof-t-vector--null "Direct link to getchildname-keyof-t-vector--null")

Returns child vector by field name.

### `getChildAt(index: number): Vector | null`[​](#getchildatindex-number-vector--null "Direct link to getchildatindex-number-vector--null")

Returns child vector by field position.

### `setChild(name: keyof T, child: Vector): RecordBatch`[​](#setchildname-keyof-t-child-vector-recordbatch "Direct link to setchildname-keyof-t-child-vector-recordbatch")

Returns a new batch with a named child replaced.

### `setChildAt(index: number, child?: Vector | null): RecordBatch`[​](#setchildatindex-number-child-vector--null-recordbatch "Direct link to setchildatindex-number-child-vector--null-recordbatch")

Returns a new batch with a child replaced at index.

### `select<K extends keyof T = any>(columnNames: K[]): RecordBatch<{ [P in K]: T[P] }>`[​](#selectk-extends-keyof-t--anycolumnnames-k-recordbatch-p-in-k-tp- "Direct link to selectk-extends-keyof-t--anycolumnnames-k-recordbatch-p-in-k-tp-")

Returns a new batch with only selected names.

### `selectAt<K extends T = any>(columnIndices: number[]): RecordBatch<{ [P in keyof K]: K[P] }>`[​](#selectatk-extends-t--anycolumnindices-number-recordbatch-p-in-keyof-k-kp- "Direct link to selectatk-extends-t--anycolumnindices-number-recordbatch-p-in-keyof-k-kp-")

Returns a new batch with only selected indexes.
