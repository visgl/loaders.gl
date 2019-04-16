# Table

Logical table as sequence of chunked arrays


## Overview

The JavaScript `Table` class is not part of the Apache Arrow specification as such, but is rather a tool to allow you to work with multiple record batches and array pieces as a single logical dataset.

As a relevant example, we may receive multiple small record batches in a socket stream, then need to concatenate them into contiguous memory for use in NumPy or pandas. The Table object makes this efficient without requiring additional memory copying.

A Table’s columns are instances of `Column`, which is a container for one or more arrays of the same type.


## Usage

`Table.new()` accepts an `Object` of `Columns` or `Vectors`, where the keys will be used as the field names for the `Schema`:

```js
const i32s = Int32Vector.from([1, 2, 3]);
const f32s = Float32Vector.from([.1, .2, .3]);
const table = Table.new({ i32: i32s, f32: f32s });
assert(table.schema.fields[0].name === 'i32');
```

It also accepts a a list of Vectors with an optional list of names or
Fields for the resulting Schema. If the list is omitted or a name is
missing, the numeric index of each Vector will be used as the name:

```ts
const i32s = Int32Vector.from([1, 2, 3]);
const f32s = Float32Vector.from([.1, .2, .3]);
const table = Table.new([i32s, f32s], ['i32']);
assert(table.schema.fields[0].name === 'i32');
assert(table.schema.fields[1].name === '1');
```

If the supplied arguments are `Column` instances, `Table.new` will infer the `Schema` from the `Column`s:

```ts
const i32s = Column.new('i32', Int32Vector.from([1, 2, 3]));
const f32s = Column.new('f32', Float32Vector.from([.1, .2, .3]));
const table = Table.new(i32s, f32s);
assert(table.schema.fields[0].name === 'i32');
assert(table.schema.fields[1].name === 'f32');
```

If the supplied Vector or Column lengths are unequal, `Table.new` will
extend the lengths of the shorter Columns, allocating additional bytes
to represent the additional null slots. The memory required to allocate
these additional bitmaps can be computed as:

```ts
let additionalBytes = 0;
for (let vec in shorter_vectors) {
 additionalBytes += (((longestLength - vec.length) + 63) & ~63) >> 3;
}
```

For example, an additional null bitmap for one million null values would require `125,000` bytes (`((1e6 + 63) & ~63) >> 3`), or approx. `0.11MiB`


## Inheritance

`Table` extends Chunked


## Static Methods

### Table.empty() : Table

Creates an empty table

### Table.from() : Table

Creates an empty table

### Table.from(source: RecordBatchReader): Table
### Table.from(source: Promise<RecordBatchReader>): Promise<Table>
### Table.from(source?: any) : Table
### Table.fromAsync(source: import('./ipc/reader').FromArgs): Promise<Table>
### Table.fromVectors(vectors: any[], names?: String[]) : Table
### Table.fromStruct(struct: Vector) : Table


### Table.new(columns: Object)
### Table.new(...columns)
### Table.new(vectors: Vector[], names: String[])

Type safe constructors. Functionally equivalent to calling `new Table()` with the same arguments, however if using Typescript using the `new` method instead will ensure that types inferred from the arguments "flow through" into the return Table type.


## Members

### schema (readonly)

The `Schema` of this table.


### length : Number (readonly)

The number of rows in this table.

TBD: this does not consider filters


### chunks : RecordBatch[] \(readonly)

The list of chunks in this table.


### numCols : Number (readonly)

The number of columns in this table.


## Methods

### constructor(batches: RecordBatch[])

The schema will be inferred from the record batches.

### constructor(...batches: RecordBatch[])

The schema will be inferred from the record batches.

### constructor(schema: Schema, batches: RecordBatch[])

### constructor(schema: Schema, ...batches: RecordBatch[])

### constructor(...args: any[])


Create a new `Table` from a collection of `Columns` or `Vectors`, with an optional list of names or `Fields`.

TBD

### clone(chunks?:)

Returns a new copy of this table.

### getColumnAt(index: number): Column | null

Gets a column by index.

### getColumn(name: String): Column | null

Gets a column by name

### getColumnIndex(name: String) : Number | null

Returns the index of the column with name `name`.

### getChildAt(index: number): Column | null

TBD

### serialize(encoding = 'binary', stream = true) : Uint8Array

Returns a `Uint8Array` that contains an encoding of all the data in the table.

Note: Passing the returned data back into `Table.from()` creates a "deep clone" of the table.


### count(): number

TBD - Returns the number of elements.

### select(...columnNames: string[]) : Table

Returns a new Table with the specified subset of columns, in the specified order.

### countBy(name : Col | String) : Table

Returns a new Table that contains two columns (`values` and `counts`).
