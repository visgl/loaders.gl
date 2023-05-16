# Apache Arrow JavaScript API Reference

## Class List

> TODO - This is a class list from the C++ docs, it has only been partially updated to match JS API

| Class             | Summary |
| ---               | ---     |
| `Array`           | Array base type Immutable data array with some logical type and some length |
| `ArrayData`       | Mutable container for generic Arrow array data  |
| `BinaryArray`     | Concrete Array class for variable-size binary data |
| `BooleanArray`    | Concrete Array class for boolean data  |
| `Buffer`          | Object containing a pointer to a piece of contiguous  memory with a particular size |
| `ChunkedArray`    | A data structure managing a list of primitive Arrow arrays logically as one large array |
| `Column`          | An immutable column data structure consisting of a field (type metadata) and a chunked data array |
| `Decimal128`      | Represents a signed 128-bit integer in two's  complement |
| `Decimal128Array` | Concrete Array class for 128-bit decimal data  |
| `DictionaryArray` | Concrete Array class for dictionary data  |
| `Field`           | The combination of a field name and data type, with  optional metadata |
| `FixedSizeBinaryArray` | Concrete Array class for fixed-size  binary data |
| `FixedWidthType`  | Base class for all fixed-width data types  |
| `FlatArray`       | Base class for non-nested arrays  |
| `FloatingPoint`   | Base class for all floating-point data types  |
| `Int16Type`       | Concrete type class for signed 16-bit integer data  |
| `Int32Type`       | Concrete type class for signed 32-bit integer data  |
| `Int64Type`       | Concrete type class for signed 64-bit integer data  |
| `Int8Type`        | Concrete type class for signed 8-bit integer data  |
| `Integer`         | Base class for all integral data types  |
| `ListArray`       | Concrete Array class for list data  |
| `ListType`        | Concrete type class for list data  |
| `NestedType`      | |
| `NullArray`       | Degenerate null type Array  |
| `NullType`        | Concrete type class for always-null data  |
| `Number`          | Base class for all numeric data types  |
| `NumericArray`    | |
| `PrimitiveArray`  | Base class for arrays of fixed-size logical  types |
| `RecordBatch`     | Collection of equal-length arrays matching a  particular Schema |
| `RecordBatchReader` | Abstract interface for reading stream of  record batches |
| `Schema`          | Sequence of arrow::Field objects describing the  columns of a record batch or table data structure |
| `Status`          | |
| `StringArray`     | Concrete Array class for variable-size string ( utf-8) data |
| `StructArray`     | Concrete Array class for struct data  |
| `Table`           | Logical table as sequence of chunked arrays  |
| `TableBatchReader` | Compute a sequence of record batches from a ( possibly chunked) Table |
| `TimeUnit`        | |
| `UnionArray`      | Concrete Array class for union data  |
