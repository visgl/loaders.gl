# Field

The combination of a field name and data type, with optional metadata. Fields are used to describe the individual constituents of a nested DataType or a Schema.


## Members

### name : String (read only)

The name of this field.

### type : Type (read only)

The type of this field.

### nullable : Boolean (read only)

Whether this field can contain `null` values, in addition to values of `Type` (this creates an extra null value map).

### metadata : Object | null (read only)

A field's metadata is represented by a map which holds arbitrary key-value pairs. Returns `null` if no metadata has been set.

### typeId : ?

TBD?

### indices : ?

TBD? Used if data type is a dictionary.


## Methods

### constructor(name : String, nullable?: Boolean, metadata?: Object)

Creates an instance of `Field` with parameters initialized as follows:

* `name` - Name of the column
* `nullable`=`false` - Whether a null-array is maintained.
* `metadata`=`null` - Map of metadata
