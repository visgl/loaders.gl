# RecordBatch

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