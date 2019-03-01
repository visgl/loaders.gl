# Arrow JavaScript API

The JavaScript Arrow API is designed to be reasonably close match to the C++ Arrow API, although some design choices are different and there are some unique capabilities as well as some missing features.

> TODO - This is a class list from the C++ docs, prune to match JS API

## Class List

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

<<<<<<< HEAD
# Arrow API Notes

> These notes are kept until Arrow API docs become available...

## About Apache Arrow

> The material in this section is assembled from various Apache Arrow docs.

* Fixed-length primitive types: numbers, booleans, date and times, fixed size binary, decimals, and other values that fit into a given number
* Variable-length primitive types: binary, string
* Nested types: list, struct, and union
* Dictionary type: An encoded categorical type


### Dictionary Arrays

The Dictionary type is a special array type that is similar to a factor in R or a pandas.Categorical in Python. It enables one or more record batches in a file or stream to transmit integer indices referencing a shared dictionary containing the distinct values in the logical array. This is particularly often used with strings to save memory and improve performance.

### RecordBatch

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

### Tables

The JavaScript `Table` type is not part of the Apache Arrow specification, but is rather a tool to help with wrangling multiple record batches and array pieces as a single logical dataset. As a relevant example, we may receive multiple small record batches in a socket stream, then need to concatenate them into contiguous memory for use in NumPy or pandas. The Table object makes this efficient without requiring additional memory copying.


Considering the record batch we created above, we can create a Table containing one or more copies of the batch using `Table.from_batches()`:

```
 const table = pa.Table.from_batches(batches)
```


The table’s columns are instances of Column, which is a container for one or more arrays of the same type.



### AsyncByteStream

### RecordBatchReader

### Schema, DataType,

### Utf8Vector


### FloatVector

### RecordBatchStreamWriter


## RecordBatchReader

The RecordBatchReader is the IPC reader for reading chunks from a stream or file

### readAll() : `AsyncIterable<RecordBatchReader>`

```
const readers = RecordBatchReader.readAll(fetch(path, {credentials: 'omit'}));
for await (const reader of reader) {
    for await (const batch of reader) {
        console.log(batch.length);
    }
}
```

If you only have one table (the normal case), then there'll only be one RecordBatchReader/the outer loop will only execute once


### from(data : \*) : RecordBatchFileReader \| RecordBatchStreamReader

`data` be
* Array
* fetch response object
* stream


The `RecordBatchReader.from` method will also detect which physical representation it's working with (Streaming or File), and will return either a `RecordBatchFileReader` or `RecordBatchStreamReader` accordingly.

if you only have one table, then there'll only be one RecordBatchReader/the outer loop will only execute once

If you know you only have one table, you can create just one reader via
```
const reader = await RecordBatchReader.from(fetch(path, {credentials: 'omit'}));
```

Remarks:
* if you're fetching the table from a node server, make sure the content-type is `application/octet-stream`



### toNodeStream()
### pipe()

You can also turn the RecordBatchReader into a stream
if you're in node, you can use either toNodeStream() or call the pipe(writable) methods



in the browser (assuming you're using the UMD or "browser" fields in webpack), you can call

### toDOMStream() or
### pipeTo(writable)/pipeThrough(transform)

In the browser (assuming you're using the UMD or "browser" fields in webpack), you can call `toDOMStream()` or `pipeTo(writable)`/`pipeThrough(transform)`

You can also create a transform stream directly, instead of using `RecordBatchReader.from()`

### throughNode
### throughDOM

via `throughNode()` and `throughDOM()` respectively:

1. https://github.com/apache/arrow/blob/49b4d2aad50e9d18cb0a51beb3a2aaff1b43e168/js/test/unit/ipc/reader/streams-node-tests.ts#L54
2. https://github.com/apache/arrow/blob/49b4d2aad50e9d18cb0a51beb3a2aaff1b43e168/js/test/unit/ipc/reader/streams-dom-tests.ts#L50

By default the transform streams will only read one table from the source readable stream and then close, but you can change this behavior by passing `{ autoDestroy: false }` to the transform creation methods
