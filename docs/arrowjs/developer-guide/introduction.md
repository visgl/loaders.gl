# Introduction

Apache Arrow is a binary specification and set of libraries for representing Tables and Columns of strongly-typed fixed-width, variable-width, and nested data structures in-memory and over-the-wire.

Arrow represents columns of values in sets of contiguous buffers. This is in contrast to a row-oriented representation, where the values for each row are stored in a contiguous buffer. The columnar representation makes it easier to take advantage of SIMD instruction sets in modern CPUs and GPUs, and can lead to dramatic performance improvements processing large amounts of data.

## Components

The Arrow library is organized into separate components responsible for creating, reading, writing, serializing, deserializing, or manipulating Tables or Columns.

- [Data Types](/docs/arrowjs/developer-guide/data-types) - Classes that define the fixed-width, variable-width, and composite data types Arrow can represent
- Vectors - Classes to read and decode JavaScript values from the underlying buffers or Vectors for each data type
- [Builders](/docs/arrowjs/developer-guide/builders) - Classes to write and encode JavaScript values into the underlying buffers or Vectors for each data type
- Visitors - Classes to traverse, manipulate, read, write, or aggregate values from trees of Arrow Vectors or DataTypes
- [IPC Readers and Writers](/docs/arrowjs/developer-guide/reading-and-writing) - Classes to read and write the Arrow IPC (inter-process communication) binary file and stream formats
- [Fields, Schemas, RecordBatches, Tables, and Columns](/docs/arrowjs/developer-guide/schemas) - Classes to describe, manipulate, read, and write groups of strongly-typed Vectors or Columns

## Concepts

 it's probably good to define some terminology:

- `Data` a collection of rows in contiguous Arrow memory. This is called "Array" in most arrow implementations but is called `Data` in Arrow JS to avoid shadowing the JS `Array` type. `Data` can have one or more underlying buffers but those buffers all represent the same data. E.g. integer storage like a `Data` of type `Uint8` has two buffers: one for the raw data (directly viewable by a `Uint8Array`) and another for the nullability bitmask: one bit for each row to confer whether the row is null or not. Nested types can have more buffers. E.g. points can be represented as a `Data` of struct type, where there's a buffer for the `x` coordinates and another buffer for the `y` coordinates.
- `Vector` a collection of rows in batches. This is essentially a list of `Data`.
- `Field`: metadata that describes an individual `Data` or `Vector`. This contains `name: string`, data type, `nullable: bool`, and `metadata: Map<string, string>`.
- `Schema`: metadata that describes a named collection of `Data` or `Vector`. This is essentially `List<Field>`, but it can also store optional associated `metadata: Map<string, string>`.
- `RecordBatch` an ordered and named collection of `Data` instances. This is essentially a `List<Data>` plus a `Schema`.
- `Table`: an ordered and named collection of `Vector` instances. This is essentially a `List<Vector>` plus a `Schema`.


## Data Types

At the heart of Arrow is set of well-known logical [data types](/docs/arrowjs/developer-guide/data-types), ensuring each Column in an Arrow Table is strongly-typed. These data types define how a Column's underlying buffers should be constructed and read, and includes configurable (and custom) metadata fields for further annotating a Column. A Schema describing each Column's name and data type is encoded alongside each Column's data buffers, allowing you to consume an Arrow data source without knowing the data types or column layout beforehand.

Each data type falls into one of three rough categories: Fixed-width types, variable-width types, or composite types that contain other Arrow data types. All data types can represent null values, which are stored in a separate validity [bitmask](https://en.wikipedia.org/wiki/Mask_(computing)). Follow the links below for a more detailed description of each data type.
