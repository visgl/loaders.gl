# Arrow JavaScript API

> The material in this section is assembled from various Apache Arrow docs.

To tap into the full power of Arrow formatted data, it is necessary to use the Arrow API directly. A typical use case is doing data frame type manipulations on the Arrow encoded data.

> This is temporary Arrow API documentation, it may be phased out when official docs for the Arrow JavaScript API become available...

Note: The JavaScript Arrow API is designed to be close match to the C++ Arrow API, although some differences have been made where it makes sense. There are some unique capabilities as well as some missing features.

## Arrow Data Types

* Fixed-length primitive types: numbers, booleans, date and times, fixed size binary, decimals, and other values that fit into a given number
* Variable-length primitive types: binary, string
* Nested types: list, struct, and union
* Dictionary type: An encoded categorical type

## Class List

> TODO - This is a class list from the C++ docs, it has only been partially updated to match JS API

| Class             | Summary |
| ---               | ---     |
| `Array`           | Array base type Immutable data array with some logical type and some length |
| `ArrayData`       | Mutable container for generic Arrow array data  |
| `ArrayVisitor`    | |
| `BinaryArray`     | Concrete Array class for variable-size binary data |
| `BinaryType`      | Concrete type class for variable-size binary data  |
| `BooleanArray`    | Concrete Array class for boolean data  |
| `BooleanType`     | Concrete type class for boolean data  |
| `Buffer`          | Object containing a pointer to a piece of contiguous  memory with a particular size |
| `ChunkedArray`    | A data structure managing a list of primitive Arrow arrays logically as one large array |
| `Column`          | An immutable column data structure consisting of a field (type metadata) and a chunked data array |
| `Compression`     | |
| `DataType`        | Base class for all data types  |
| `Date32Type`      | Concrete type class for 32-bit date data (as  number of days since UNIX epoch) |
| `Date64Type`      | Concrete type class for 64-bit date data (as  number of milliseconds since UNIX epoch) |
| `DateType`        | Base type class for date data  |
| `Decimal128`      | Represents a signed 128-bit integer in two's  complement |
| `Decimal128Array` | Concrete Array class for 128-bit decimal data  |
| `Decimal128Type`  | Concrete type class for 128-bit decimal data  |
| `DecimalType`     | Base type class for (fixed-size) decimal data  |
| `DictionaryArray` | Concrete Array class for dictionary data  |
| `DictionaryType`  | Concrete type class for dictionary data  |
| `DoubleType`      | Concrete type class for 64-bit floating-point  data (C "double") |
| `Field`           | The combination of a field name and data type, with  optional metadata |
| `FixedSizeBinaryArray` | Concrete Array class for fixed-size  binary data |
| `FixedSizeBinaryType` | Concrete type class for fixed-size  binary data |
| `FixedWidthType`  | Base class for all fixed-width data types  |
| `FlatArray`       | Base class for non-nested arrays  |
| `FloatingPoint`   | Base class for all floating-point data types  |
| `FloatType`       | Concrete type class for 32-bit floating-point data ( C "float") |
| `HalfFloatType`   | Concrete type class for 16-bit floating-point  data |
| `Int16Type`       | Concrete type class for signed 16-bit integer data  |
| `Int32Type`       | Concrete type class for signed 32-bit integer data  |
| `Int64Type`       | Concrete type class for signed 64-bit integer data  |
| `Int8Type`        | Concrete type class for signed 8-bit integer data  |
| `Integer`         | Base class for all integral data types  |
| `IntervalType`    | |
| `is_8bit_int`     | |
| `IsFloatingPoint` | |
| `IsInteger`       | |
| `IsNumeric`       | |
| `IsSignedInt`     | |
| `IsUnsignedInt`   | |
| `KeyValueMetadata` | |
| `ListArray`       | Concrete Array class for list data  |
| `ListType`        | Concrete type class for list data  |
| `NestedType`      | |
| `NoExtraMeta`     | |
| `NullArray`       | Degenerate null type Array  |
| `NullType`        | Concrete type class for always-null data  |
| `Number`          | Base class for all numeric data types  |
| `NumericArray`    | |
| `NumericTensor`   | |
| `ParametricType`  | Base class for all parametric data types  |
| `PrimitiveArray`  | Base class for arrays of fixed-size logical  types |
| `PrimitiveCType`  | Base class for all data types representing  primitive values |
| `ProxyMemoryPool` | Derived class for memory allocation  |
| `RecordBatch`     | Collection of equal-length arrays matching a  particular Schema |
| `RecordBatchReader` | Abstract interface for reading stream of  record batches |
| `Schema`          | Sequence of arrow::Field objects describing the  columns of a record batch or table data structure |
| `Status`          | |
| `StringArray`     | Concrete Array class for variable-size string ( utf-8) data |
| `StringType`      | Concrete type class for variable-size string  data, utf8-encoded |
| `StructArray`     | Concrete Array class for struct data  |
| `StructType`      | Concrete type class for struct data  |
| `Table`           | Logical table as sequence of chunked arrays  |
| `TableBatchReader` | Compute a sequence of record batches from a ( possibly chunked) Table |
| `Tensor`          | |
| `Time32Type`      | |
| `Time64Type`      | |
| `TimestampType`   | |
| `TimeType`        | Base type class for time data  |
| `TimeUnit`        | |
| `Type`            | Main data type enumeration  |
| `UInt16Type`      | Concrete type class for unsigned 16-bit integer  data |
| `UInt32Type`      | Concrete type class for unsigned 32-bit integer  data |
| `UInt64Type`      | Concrete type class for unsigned 64-bit integer  data |
| `UInt8Type`       | Concrete type class for unsigned 8-bit integer data  |
| `UnionArray`      | Concrete Array class for union data  |
| `UnionMode`       | |
| `UnionType`       | Concrete type class for union data  |
