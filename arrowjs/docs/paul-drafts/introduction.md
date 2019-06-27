# Introduction

Apache Arrow is a binary specification and set of libraries for representing Tables and Columns of strongly-typed fixed-width, variable-width, and nested data structures in-memory and over-the-wire.

Arrow represents columns of values in sets of contiguous buffers. This is in contrast to a row-oriented representation, where the values for each row are stored in a contiguous buffer. The columnar representation makes it easier to take advantage of SIMD instruction sets in modern CPUs and GPUs, and can lead to dramatic performance improvements processing large amounts of data.

## Components

The Arrow library is organized into separate components responsible for creating, reading, writing, serializing, deserializing, or manipulating Tables or Columns.

* [Data Types](docs/paul-drafts/introduction.md#arrow-data-types) - Classes that define the fixed-width, variable-width, and composite data types Arrow can represent
* [Vectors](docs/paul-drafts/introduction.md#arrow-vectors) - Classes to read and decode JavaScript values from the underlying buffers or Vectors for each data type
* [Builders](docs/paul-drafts/introduction.md#arrow-builders) - Classes to write and encode JavaScript values into the underlying buffers or Vectors for each data type
* [Visitors](docs/paul-drafts/introduction.md#arrow-visitors) - Classes to traverse, manipulate, read, write, or aggregate values from trees of Arrow Vectors or DataTypes
* [IPC Readers and Writers](docs/paul-drafts/introduction.md#arrow-ipc-primitives) - Classes to read and write the Arrow IPC (inter-process communication) binary file and stream formats
* [Fields, Schemas, RecordBatches, Tables, and Columns](docs/paul-drafts/introduction.md#fields-schemas-recordbatches-tables-and-columns) - Classes to describe, manipulate, read, and write groups of strongly-typed Vectors or Columns

## [Data Types](docs/paul-drafts/data-types/index.md)

At the heart of Arrow is set of well-known logical [data types](docs/paul-drafts/data-types/index.md), ensuring each Column in an Arrow Table is strongly-typed. These data types define how a Column's underlying buffers should be constructed and read, and includes configurable (and custom) metadata fields for further annotating a Column. A Schema describing each Column's name and data type is encoded alongside each Column's data buffers, allowing you to consume an Arrow data source without knowing the data types or column layout beforehand.

Each data type falls into one of three rough categories: Fixed-width types, variable-width types, or composite types that contain other Arrow data types. All data types can represent null values, which are stored in a separate validity [bitmask](https://en.wikipedia.org/wiki/Mask_(computing)). Follow the links below for a more detailed description of each data type.

### [Fixed-width Data Types](docs/paul-drafts/data-types/index.md#fixed-width-data-types)

Fixed-width data types describe physical primitive values (bytes or bits of some fixed size), or logical values that can be represented as primitive values. In addition to an optional [`Uint8Array`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array) validity bitmask, these data types have a physical data buffer (a [`TypedArray`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray#TypedArray_objects) corresponding to the data type's physical element width).

 * [Null](docs/paul-drafts/data-types/index.md#null) - A column of NULL values having no physical storage
 * [Bool](docs/paul-drafts/data-types/index.md#bool) - Booleans as either 0 or 1 (bit-packed, LSB-ordered)
 * [Int](docs/paul-drafts/data-types/index.md#int) - Signed or unsigned 8, 16, 32, or 64-bit little-endian integers
 * [Float](docs/paul-drafts/data-types/index.md#float) - 2, 4, or 8-byte floating point values
 * [Decimal](docs/paul-drafts/data-types/index.md#decimal) - Precision-and-scale-based 128-bit decimal values
 * [FixedSizeBinary](docs/paul-drafts/data-types/index.md#fixedsizebinary) - A list of fixed-size binary sequences, where each value occupies the same number of bytes
 * [Date](docs/paul-drafts/data-types/index.md#date) - Date as signed 32-bit integer days or 64-bit integer milliseconds since the UNIX epoch
 * [Time](docs/paul-drafts/data-types/index.md#time) - Time as signed 32 or 64-bit integers, representing either seconds, millisecond, microseconds, or nanoseconds since midnight (00:00:00)
 * [Timestamp](docs/paul-drafts/data-types/index.md#timestamp) - Exact timestamp as signed 64-bit integers, representing either seconds, milliseconds, microseconds, or nanoseconds since the UNIX epoch
 * [Interval](docs/paul-drafts/data-types/index.md#interval) - Time intervals as pairs of either (year, month) or (day, time) in SQL style
 * [FixedSizeList](docs/paul-drafts/data-types/index.md#fixedsizelist) - Fixed-size sequences of another logical Arrow data type

### [Variable-width Data Types](docs/paul-drafts/data-types/index.md#variable-width-data-types)

Variable-width types describe lists of values with different widths, including binary blobs, Utf8 code-points, or slices of another underlying Arrow data type. These types store the values contiguously in memory, and have a physical [`Int32Array`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Int32Array) of offsets that describe the start and end indicies of each list element.

 * [List](docs/paul-drafts/data-types/list.md) - Variable-length sequences of another logical Arrow data type
 * [Utf8](docs/paul-drafts/data-types/utf8.md) - Variable-length byte sequences of UTF8 code-points (strings)
 * [Binary](docs/paul-drafts/data-types/binary.md) - Variable-length byte sequences (no guarantee of UTF8-ness)

### [Composite Data Types](docs/paul-drafts/data-types/index.md#composite-data-types)

Composite types don't have physical data buffers of their own. They contain other Arrow data types and delegate work to them.

 * [Union](docs/paul-drafts/data-types/union.md) - Union of logical child data types
 * [Map](docs/paul-drafts/data-types/map.md) - Map of named logical child data types
 * [Struct](docs/paul-drafts/data-types/struct.md) - Struct of ordered logical child data types
