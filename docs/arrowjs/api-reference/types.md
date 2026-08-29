---
title: Arrow data types
description: Choose the logical types used by Apache Arrow JS fields, vectors, builders, and tables.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Arrow JS API · type system"
  title="Choose a logical type before choosing storage."
  description="Arrow DataType classes describe what a column means: integers, floating point, text, binary, timestamps, lists, structs, maps, unions, and dictionaries. Builders and vectors use that choice to keep values typed."
  tone="yellow"
  meta={['Primitive types', 'Nested types', 'Temporal and dictionary types']}
  links={[
    {label: 'Schema', to: '/docs/arrowjs/api-reference/schema'},
    {label: 'Field', to: '/docs/arrowjs/api-reference/field'},
    {label: 'Builder', to: '/docs/arrowjs/api-reference/builder'}
  ]}
/>

<DocOrientation
  eyebrow="The Arrow type map"
  title="Make values portable by naming their meaning."
  description="A DataType is more than a JavaScript constructor. It determines buffers, null handling, nested children, serialization, and how another Arrow implementation interprets the column."
  tone="yellow"
  items={[
    {label: 'Scalar', value: 'Null, Bool, integers, floats, decimals, and binary/text'},
    {label: 'Temporal', value: 'Date, time, timestamp, duration, and interval types'},
    {label: 'Nested', value: 'List, fixed-size list, struct, map, and union'},
    {label: 'Encoded', value: 'Dictionary and other types with child or index storage'}
  ]}
/>

<ReferenceBoundary
  title="DataType reference"
  description="The sections below list core type families, constructors, properties, predicates, and the relationships between types, fields, and storage."
  tone="yellow"
/>

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
