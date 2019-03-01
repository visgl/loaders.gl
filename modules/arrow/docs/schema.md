# Schema

Sequence of arrow::Field objects describing the columns of a record batch or table data structure


## Accessors

### fields : Field[]

Return the list of fields (columns) in the schema.

### metadata

The custom key-value metadata, if any. metadata may be null.

### dictionaries

TBD?

### dictionaryFields

TBD?


## Methods

### constructor(fields: Field[], metadata?: Object, dictionaries?: Object, dictionaryFields?: Object)

Creates a new schema instance.


### select(columnNames) : Schema

Returns a new `Schema` with the Fields indicated by the column names.


