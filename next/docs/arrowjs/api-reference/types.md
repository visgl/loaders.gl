Arrow JS API · type system

# Choose a logical type before choosing storage.

Arrow DataType classes describe what a column means: integers, floating point, text, binary, timestamps, lists, structs, maps, unions, and dictionaries. Builders and vectors use that choice to keep values typed.

[Schema](https://loaders.gl/next/docs/arrowjs/api-reference/schema.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs/api-reference/schema.md)[Field](https://loaders.gl/next/docs/arrowjs/api-reference/field.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs/api-reference/field.md)[Builder](https://loaders.gl/next/docs/arrowjs/api-reference/builder.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs/api-reference/builder.md)

The Arrow type map

## Make values portable by naming their meaning.

A DataType is more than a JavaScript constructor. It determines buffers, null handling, nested children, serialization, and how another Arrow implementation interprets the column.

01

Scalar

Null, Bool, integers, floats, decimals, and binary/text

02

Temporal

Date, time, timestamp, duration, and interval types

03

Nested

List, fixed-size list, struct, map, and union

04

Encoded

Dictionary and other types with child or index storage

Detailed guide

## DataType reference

The sections below list core type families, constructors, properties, predicates, and the relationships between types, fields, and storage.

info

This page is aligned to Apache Arrow JS v21.x (`apache-arrow`).

Arrow `DataType` classes describe logical column types. You compose schemas, builders, and vectors from these types.

## Usage[​](#usage "Direct link to Usage")

```
import {Int32, Utf8, Struct, Field, Schema} from 'apache-arrow';



const schema = new Schema([

  new Field('id', new Int32(), false),

  new Field('name', new Utf8(), true)

]);
```

```
import {DataType} from 'apache-arrow';



console.log(DataType.isInt(new Int32()));
```

## Core type families[​](#core-type-families "Direct link to Core type families")

### Null and boolean[​](#null-and-boolean "Direct link to Null and boolean")

* `Null`
* `Bool`

### Integer[​](#integer "Direct link to Integer")

* `Int`
* `Int8`
* `Int16`
* `Int32`
* `Int64`
* `Uint8`
* `Uint16`
* `Uint32`
* `Uint64`

### Floating point[​](#floating-point "Direct link to Floating point")

* `Float`
* `Float16`
* `Float32`
* `Float64`

### Binary and text[​](#binary-and-text "Direct link to Binary and text")

* `Binary`
* `LargeBinary`
* `Utf8`
* `LargeUtf8`
* `FixedSizeBinary`

### Temporal[​](#temporal "Direct link to Temporal")

* `Date_`
* `DateDay`
* `DateMillisecond`
* `Time`
* `TimeSecond`
* `TimeMillisecond`
* `TimeMicrosecond`
* `TimeNanosecond`
* `Timestamp`
* `TimestampSecond`
* `TimestampMillisecond`
* `TimestampMicrosecond`
* `TimestampNanosecond`

### Decimal[​](#decimal "Direct link to Decimal")

* `Decimal`

### Nested[​](#nested "Direct link to Nested")

* `List`
* `FixedSizeList`
* `Struct`
* `Map_`
* `Union`
* `SparseUnion`
* `DenseUnion`

### Dictionary and intervals[​](#dictionary-and-intervals "Direct link to Dictionary and intervals")

* `Dictionary`
* `Duration`
* `DurationSecond`
* `DurationMillisecond`
* `DurationMicrosecond`
* `DurationNanosecond`
* `Interval`
* `IntervalDayTime`
* `IntervalYearMonth`

## Static type checks[​](#static-type-checks "Direct link to Static type checks")

`DataType` exports runtime type guards with typed boolean outcomes:

* `DataType.isInt(x: unknown): x is Int`
* `DataType.isFloat(x: unknown): x is Float`
* `DataType.isUtf8(x: unknown): x is Utf8`
* `DataType.isList(x: unknown): x is List`
* `DataType.isStruct(x: unknown): x is Struct`
* `DataType.isDictionary(x: unknown): x is Dictionary`

## Migration notes[​](#migration-notes "Direct link to Migration notes")

Older docs and examples frequently use type-specific vector names (for example `Int32Vector`). In Apache Arrow JS v21, those are not the primary exported public classes; use:

* `new Int32()` / `new Utf8()` to describe schema-level types
* `makeVector` / `vectorFromArray` to build vectors
* `Schema`, `Field`, and `Table` for structured data assembly
