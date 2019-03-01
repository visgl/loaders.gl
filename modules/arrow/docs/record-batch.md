# RecordBatch

## Overview

A Record Batch in Apache Arrow is a collection of equal-length array instances.

Let’s consider a collection of arrays:

```
In [66]: data = [
   ....:     pa.array([1, 2, 3, 4]),
   ....:     pa.array(['foo', 'bar', 'baz', None]),
   ....:     pa.array([True, None, False, True])
   ....: ]
   ....:
```

A record batch can be created from this list of arrays using RecordBatch.from_arrays:


## Static Methods

### RecordBatch.from(vectors: Array, names: String[] = []) : RecordBatch

## Members

### schema : Schema (readonly)

### numCols : Number (readonly)

Returns number of fields/columns in the schema (shorthand for `this.schema.fields.length`.)

## Methods

### constructor(schema: Schema, numRows: Number, childData: (Data | Vector)[]);
### constructor(schema: Schema, data: Data, children?: Vector[]);
### constructor(...args: any[])

### clone(data: Data<Struct<T>>, children?: Array) : RecordBatch

### concat(...others: Vector<Struct<T>>[]) : Table

### select(...columnNames: K[]) : RecordBatch