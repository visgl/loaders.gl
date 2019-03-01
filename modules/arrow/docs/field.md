# Field

The combination of a field name and data type, with optional metadata. Fields are used to describe the individual constituents of a nested DataType or a Schema.


## Members

### name : String (Read-only)

### type : Type (Read-only)

### nullable : Boolean (Read-only)

### metadata : Object | null (Read-only)

A field's metadata is represented by a map which holds arbitrary key-value pairs.

### typeId : ?

TBD?

### indices : ?

TBD? Used if data type is a dictionary.


## Methods

### constructor(name : String, nullable?: Boolean, metadata?: Object)

* `name` - Name of the column
* `nullable`=`false` - Whether a null-array is maintained.
* `metadata`=`null` - Map of metadata
