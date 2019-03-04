# Column

An immutable column data structure consisting of a field (type metadata) and a chunked data array.

Many useful methods are inherited from [`Chunked`](modules/arrow/docs/api-reference/chunked.md).


## Usage

To get a contiguous typed array from a column
```js
const typedArray = column.slice();
```

You can of course iterate over a column:
```js
let max = column.get(0);
let min = max;
for (const value of column) {
  if      (value > max) max = value;
  else if (value < min) min = value;
}
```

## Extends

Column extends [`Chunked`](modules/arrow/docs/api-referencechunked.md)


## Fields

In addition to fields inherited from `Chunked`, Colum also defines

### name : String

The name of the column (short for `field.name`)

### field : Field

Returns the field description for the column. A `Field` describes an individual constituents of a nested DataType or a `Schema`.


## Methods

In addition to fields inherited from `Chunked`, Colum also defines


### constructor(field : Field, vectors: Vector, offsets?: Uint32Array)


### clone

Returns a new `Column` instance with the same properties.


### getChildAt(index : Number) : Column

TBD
