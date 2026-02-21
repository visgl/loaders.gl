# Types

:::info
This page is aligned to Apache Arrow JS v21.x (`apache-arrow`).
:::

Arrow `DataType` classes describe logical column types. You compose schemas, builders, and vectors from these types.

## Usage

```ts
import {Int32, Utf8, Struct, Field, Schema} from 'apache-arrow';

const schema = new Schema([
  new Field('id', new Int32(), false),
  new Field('name', new Utf8(), true)
]);
```

```ts
import {DataType} from 'apache-arrow';

console.log(DataType.isInt(new Int32()));
```

## Core type families

### Null and boolean

- `Null`
- `Bool`

### Integer

- `Int`
- `Int8`
- `Int16`
- `Int32`
- `Int64`
- `Uint8`
- `Uint16`
- `Uint32`
- `Uint64`

### Floating point

- `Float`
- `Float16`
- `Float32`
- `Float64`

### Binary and text

- `Binary`
- `LargeBinary`
- `Utf8`
- `LargeUtf8`
- `FixedSizeBinary`

### Temporal

- `Date_`
- `DateDay`
- `DateMillisecond`
- `Time`
- `TimeSecond`
- `TimeMillisecond`
- `TimeMicrosecond`
- `TimeNanosecond`
- `Timestamp`
- `TimestampSecond`
- `TimestampMillisecond`
- `TimestampMicrosecond`
- `TimestampNanosecond`

### Decimal

- `Decimal`

### Nested

- `List`
- `FixedSizeList`
- `Struct`
- `Map_`
- `Union`
- `SparseUnion`
- `DenseUnion`

### Dictionary and intervals

- `Dictionary`
- `Duration`
- `DurationSecond`
- `DurationMillisecond`
- `DurationMicrosecond`
- `DurationNanosecond`
- `Interval`
- `IntervalDayTime`
- `IntervalYearMonth`

## Static type checks

`DataType` exports runtime type guards with typed boolean outcomes:

- `DataType.isInt(x: unknown): x is Int`
- `DataType.isFloat(x: unknown): x is Float`
- `DataType.isUtf8(x: unknown): x is Utf8`
- `DataType.isList(x: unknown): x is List`
- `DataType.isStruct(x: unknown): x is Struct`
- `DataType.isDictionary(x: unknown): x is Dictionary`

## Migration notes

Older docs and examples frequently use type-specific vector names (for example `Int32Vector`).
In Apache Arrow JS v21, those are not the primary exported public classes; use:

- `new Int32()` / `new Utf8()` to describe schema-level types
- `makeVector` / `vectorFromArray` to build vectors
- `Schema`, `Field`, and `Table` for structured data assembly
