# RecordBatch

## Overview

A Record Batch in Apache Arrow is a collection of equal-length array instances.

## Usage

A record batch can be created from this list of arrays using `RecordBatch.from`:
```
const data = [
  new Array([1, 2, 3, 4]),
  new Array(['foo', 'bar', 'baz', None]),
  new Array([True, None, False, True])
]

const recordBatch = RecordBatch.from(arrays);
```


## Inheritance

`RecordBatch` extends `StructVector` extends `BaseVector`


## Members

### schema : Schema (readonly)

Returns the schema of the data in the record batch

### numCols : Number (readonly)

Returns number of fields/columns in the schema (shorthand for `this.schema.fields.length`).


## Static Methods

### RecordBatch.from(vectors: Array, names: String[] = []) : RecordBatch

Creates a `RecordBatch`, see `RecordBatch.new()`.


### RecordBatch.new(vectors: Array, names: String[] = []) : RecordBatch

Creates new a record batch.

Schema is auto inferred, using names or index positions if `names` are not supplied.


## Methods

### constructor(schema: Schema, numRows: Number, childData: (Data | Vector)[])

Create a new `RecordBatch` instance with `numRows` rows of child data.

* `numRows` - 
* `childData` - 


### constructor(schema: Schema, data: Data, children?: Vector[])

Create a new `RecordBatch` instance with `numRows` rows of child data.

### constructor(...args: any[])

### clone(data: Data, children?: Array) : RecordBatch

Returns a newly allocated copy of this `RecordBatch`

### concat(...others: Vector[]) : Table

Concatenates a number of `Vector` instances.

### select(...columnNames: K[]) : RecordBatch

Return a new `RecordBatch` with a subset of columns.
