# Table

Logical table as sequence of chunked arrays

Extends `Chunked`

## Overview

The JavaScript `Table` class is not part of the Apache Arrow specification as such, but is rather a tool to allow you to work with multiple record batches and array pieces as a single logical dataset.

As a relevant example, we may receive multiple small record batches in a socket stream, then need to concatenate them into contiguous memory for use in NumPy or pandas. The Table object makes this efficient without requiring additional memory copying.

A Table’s columns are instances of `Column`, which is a container for one or more arrays of the same type.


## Static Methods

### Table.empty() : Table
### Table.from(): Table
### Table.from(source: RecordBatchReader): Table
### Table.from(source: Promise<RecordBatchReader>): Promise<Table>
### Table.from(source?: any) : Table
### Table.fromAsync(source: import('./ipc/reader').FromArgs): Promise<Table>
### Table.fromVectors(vectors: any[], names?: String[]) : Table
### Table.fromStruct(struct: Vector) : Table

## Members

### schema (readonly)

The Schema of this table

### length (readonly)
### chunks (readonly)

The list of chunks in this table.

### numCols (readonly)

The number of columns in this table.


## Methods

### constructor(batches: RecordBatch[])

The schema will be inferred from the record batches.

### constructor(...batches: RecordBatch[])

The schema will be inferred from the record batches.

### constructor(schema: Schema, batches: RecordBatch[])
### constructor(schema: Schema, ...batches: RecordBatch[])
### constructor(...args: any[])

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

### serialize(encoding = 'binary', stream = true)

TBD

### count(): number

TBD - Returns the number of elements.

### select(...columnNames: string[])

Returns a new Table with the specified subset of columns, in the specified order.

### countBy(name : Col | String) : DataFrame

Returns a new Table that contains two columns.
