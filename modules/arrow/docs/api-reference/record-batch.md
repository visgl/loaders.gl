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


## Members

### schema : Schema (readonly)

Returns the schema of the data in the record batch

### numCols : Number (readonly)

Returns number of fields/columns in the schema (shorthand for `this.schema.fields.length`).


## Static Methods

### RecordBatch.from(vectors: Array, names: String[] = []) : RecordBatch

Creates a record batch.

TBD
- Schema is auto inferred.


## Methods

### constructor(schema: Schema, numRows: Number, childData: (Data | Vector)[])

Create a new RecordBatch instance with `numRows` rows of child data.


### constructor(schema: Schema, data: Data, children?: Vector[])


### constructor(...args: any[])


### clone(data: Data, children?: Array) : RecordBatch

### concat(...others: Vector[]) : Table

Concatenates a number of Vectors

### select(...columnNames: K[]) : RecordBatch

Return a new RecordBatch with a subset of columns
