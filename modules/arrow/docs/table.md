# Table

Logical table as sequence of chunked arrays


Extends `Chunked`


## Static Methods

### Table.empty()
### Table.from(): Table;
### Table.from(source: RecordBatchReader): Table;
### Table.from(source: PromiseLike<RecordBatchReader>): Promise<Table>;
### Table.from(source?: any)
### Table.async fromAsync(source: import('./ipc/reader').FromArgs): Promise<Table>
### Table.fromVectors(vectors: VType<T[keyof T]>[], names?: (keyof T)[])
### Table.fromStruct(struct: Vector<Struct>) : Table

## Members

### get schema()
### get length()
### get chunks()
### get numCols()

## Methods

### constructor(batches: RecordBatch[]);
### constructor(...batches: RecordBatch[]);
### constructor(schema: Schema, batches: RecordBatch[]);
### constructor(schema: Schema, ...batches: RecordBatch[]);
### constructor(...args: any[])

### clone(chunks?:)
### getColumnAt(index: number): Column | null
### getColumn(name: R): Column | null
### getColumnIndex(name: R)
### getChildAt(index: number): Column | null
### serialize(encoding = 'binary', stream = true)
### count(): number
### select(...columnNames: string[])

### countBy(name : Col | String) : DataFrame
