Arrow JS API · container

# The table is the application-facing container.

Table combines one or more record-batch chunks into a logical set of named, typed columns. Use it for ordinary multi-column Arrow data, then choose rows, vectors, or batches for the next operation.

[Arrow JS guide](https://loaders.gl/next/docs/arrowjs.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs.md)[RecordBatch](https://loaders.gl/next/docs/arrowjs/api-reference/record-batch.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs/api-reference/record-batch.md)[Vector](https://loaders.gl/next/docs/arrowjs/api-reference/vector.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs/api-reference/vector.md)

The Table model

## One logical table, many physical batches.

A Table keeps the schema and row count stable while allowing data to arrive or remain stored in record-batch chunks. This is the useful boundary between IPC, loaders, scans, and application code.

01

Schema

Names and types shared by the table columns

02

Batches

Row-aligned RecordBatch chunks

03

Access

Rows, child vectors, slices, and iteration

04

Scale

Chunking without changing the logical table shape

Detailed guide

## Table reference

The sections below document construction, members, row and column access, slicing, iteration, and serialization-related behavior.

info

This page is aligned to Apache Arrow JS v21.x (`apache-arrow`).

A logical table as a sequence of record-batch chunks.

## Overview[​](#overview "Direct link to Overview")

`Table` is the columnar container in Arrow JS and the recommended way to handle multi-column, multi-row Arrow data in memory.

## Usage[​](#usage "Direct link to Usage")

```
import {makeTable, tableFromArrays, Table} from 'apache-arrow';



const table = tableFromArrays({

  a: new Int32Array([1, 2, 3]),

  b: ['x', 'y', 'z']

});



const fromArrays = tableFromArrays({

  a: [1, 2, 3],

  b: ['x', 'y', 'z']

});



console.log(Table !== undefined, table.numRows, table.numCols);
```

## Members[​](#members "Direct link to Members")

### `schema: Schema` (readonly)[​](#schema-schema-readonly "Direct link to schema-schema-readonly")

Table schema.

### `batches: RecordBatch[]` (readonly)[​](#batches-recordbatch-readonly "Direct link to batches-recordbatch-readonly")

List of logical table chunks.

### `data: Data<Struct>[]` (readonly)[​](#data-datastruct-readonly "Direct link to data-datastruct-readonly")

Convenience getter for backing `Data` chunks.

### `numCols: number` (readonly)[​](#numcols-number-readonly "Direct link to numcols-number-readonly")

Number of columns.

### `numRows: number` (readonly)[​](#numrows-number-readonly "Direct link to numrows-number-readonly")

Total row count across chunks.

### `nullCount: number` (readonly)[​](#nullcount-number-readonly "Direct link to nullcount-number-readonly")

Total number of null rows.

## Constructors[​](#constructors "Direct link to Constructors")

`Table` has multiple constructor forms.

* `new Table()`
* `new Table(...batches: RecordBatch[])`
* `new Table(...columns: Vector[])`
* `new Table(schema: Schema, ...columns: Vector[])`
* `new Table(schema: Schema, data?: RecordBatch | RecordBatch[])`

Use `makeTable` for typed array convenience and `tableFromArrays` for mixed JS arrays + typed arrays.

## Methods[​](#methods "Direct link to Methods")

### `isValid(index: number): boolean`[​](#isvalidindex-number-boolean "Direct link to isvalidindex-number-boolean")

Returns whether row at `index` is non-null.

### `get(index: number): Struct<T> | null`[​](#getindex-number-structt--null "Direct link to getindex-number-structt--null")

Returns the row value at `index`.

### `at(index: number): Struct<T> | null`[​](#atindex-number-structt--null "Direct link to atindex-number-structt--null")

Returns the row value at `index`, supporting negative indexes.

### `set(index: number, value: Struct<T>['TValue'] | null): void`[​](#setindex-number-value-structttvalue--null-void "Direct link to setindex-number-value-structttvalue--null-void")

Writes a row value at `index`.

### `indexOf(element: Struct<T>, offset?: number): number`[​](#indexofelement-structt-offset-number-number "Direct link to indexofelement-structt-offset-number-number")

Finds the first row equal to `element`, starting from optional `offset`.

### `[Symbol.iterator](): IterableIterator<any>`[​](#symboliterator-iterableiteratorany "Direct link to symboliterator-iterableiteratorany")

Iterates table rows.

### `toArray(): any[]`[​](#toarray-any "Direct link to toarray-any")

Converts rows to a standard array.

### `toString(): string`[​](#tostring-string "Direct link to tostring-string")

Returns a string summary for debugging.

### `concat(...others: Table<T>[]): Table<T>`[​](#concatothers-tablet-tablet "Direct link to concatothers-tablet-tablet")

Concatenates same-schema tables and returns a new table.

### `slice(begin?: number, end?: number): Table<T>`[​](#slicebegin-number-end-number-tablet "Direct link to slicebegin-number-end-number-tablet")

Returns a zero-copy row slice using `[begin, end)`.

### `getChild(name: keyof T): Vector | null`[​](#getchildname-keyof-t-vector--null "Direct link to getchildname-keyof-t-vector--null")

Gets a child vector by name.

### `getChildAt(index: number): Vector | null`[​](#getchildatindex-number-vector--null "Direct link to getchildatindex-number-vector--null")

Gets a child vector by index.

### `setChild(name: keyof T, child: Vector): Table`[​](#setchildname-keyof-t-child-vector-table "Direct link to setchildname-keyof-t-child-vector-table")

Returns a new table with the named child replaced.

### `setChildAt(index: number, child?: Vector | null): Table`[​](#setchildatindex-number-child-vector--null-table "Direct link to setchildatindex-number-child-vector--null-table")

Returns a new table with child vector at `index` replaced.

### `select<K extends keyof T = any>(columnNames: K[]): Table<{ [P in K]: T[P] }>`[​](#selectk-extends-keyof-t--anycolumnnames-k-table-p-in-k-tp- "Direct link to selectk-extends-keyof-t--anycolumnnames-k-table-p-in-k-tp-")

Returns a table including only selected column names.

### `selectAt<K extends T = any>(columnIndices: number[]): Table<{ [P in keyof K]: K[P] }>`[​](#selectatk-extends-t--anycolumnindices-number-table-p-in-keyof-k-kp- "Direct link to selectatk-extends-t--anycolumnindices-number-table-p-in-keyof-k-kp-")

Returns a table including only selected column indices.

### `assign<R extends TypeMap = any>(other: Table<R>): Table<T & R>`[​](#assignr-extends-typemap--anyother-tabler-tablet--r "Direct link to assignr-extends-typemap--anyother-tabler-tablet--r")

Returns a merged schema/data table with `other` columns merged by field name.

## Notes[​](#notes "Direct link to Notes")

* The `Table` API no longer exposes `count` or `countBy` methods in v21.
* Legacy `getColumn` / `getColumnAt` and `length`-only helpers are replaced by `getChild`/`getChildAt` and `numRows`.
