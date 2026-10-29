Arrow JS API · construction

# Build typed vectors as values arrive.

Builder APIs turn incremental values into typed Arrow vectors. They are useful when a loader, transform, or application receives records over time and wants to finish a column without first assembling an untyped JavaScript array.

[Vector](https://loaders.gl/next/docs/arrowjs/api-reference/vector.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs/api-reference/vector.md)[Table](https://loaders.gl/next/docs/arrowjs/api-reference/table.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs/api-reference/table.md)[Arrow JS guide](https://loaders.gl/next/docs/arrowjs.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs.md)

The builder path

## Choose a type. Append values. Finish a vector.

makeBuilder selects a concrete builder from a DataType and supports null sentinels and nested children. Keep the builder at the ingestion boundary, then pass the finished vector into a batch or table.

01

Declare

Choose the target DataType

02

Append

Add values or configured null sentinels

03

Finish

Materialize the Vector when the chunk is complete

04

Compose

Use child builders for Struct, List, Map, and Union types

Detailed guide

## Builder reference

The sections below document makeBuilder, options, append and finish behavior, nested builders, and concrete builder classes.

info

This page is aligned to Apache Arrow JS v21.x (`apache-arrow`).

The `Builder` APIs are the primary API for incremental vector construction.

`makeBuilder()` inspects a `DataType` and returns a concrete builder instance.

```
import {makeBuilder, Builder, Int32, Utf8} from 'apache-arrow';



const builder = makeBuilder({

  type: new Int32(),

  nullValues: [null, 'n/a']

});



builder.append(1).append(null).append(3);

const vector = builder.toVector();
```

## Usage[​](#usage "Direct link to Usage")

```
import {makeBuilder, Int32} from 'apache-arrow';



const ids = makeBuilder({type: new Int32()});

ids.append(1).append(2).append(3);

const idVector = ids.toVector();
```

```
import {makeBuilder, Utf8} from 'apache-arrow';



const words = makeBuilder({type: new Utf8(), nullValues: ['N/A']});

for (const token of ['a', null, 'N/A']) {

  words.append(token);

}

const text = words.finish().toVector();
```

## makeBuilder[​](#makebuilder "Direct link to makeBuilder")

`makeBuilder(options: BuilderOptions): Builder`

Creates a concrete `Builder` instance from a shared options object.

```
type BuilderOptions<T extends DataType = any, TNull = any> = {

  type: T;

  nullValues?: TNull[] | ReadonlyArray<TNull> | null;

  children?: {[key: string]: BuilderOptions} | BuilderOptions[];

};



makeBuilder({

  type: new Utf8(),

  nullValues: [null, 'N/A']

});
```

* `options.type` — Target `DataType` for all values this builder will emit.
* `options.nullValues` — Optional sentinel values treated as null (`null` by default).
* `options.children` — Nested builder options for complex types (`List`, `Struct`, `Map`, `Union`).

## Builder methods[​](#builder-methods "Direct link to Builder methods")

### Static helpers[​](#static-helpers "Direct link to Static helpers")

* `Builder.throughNode(options: BuilderDuplexOptions<T, TNull>): Duplex`
  * Creates a Node.js transform that accepts incoming values and yields serialized vectors.
* `Builder.throughDOM(options: BuilderTransformOptions<T, TNull>): BuilderTransform`
  * Creates a WHATWG `TransformStream` that buffers input values into vector chunks.

## Constructor[​](#constructor "Direct link to Constructor")

`new Builder<T extends DataType = any, TNull = any>(options: BuilderOptions<T, TNull>)`

Creates an appropriately typed builder implementation.

### Instance methods[​](#instance-methods "Direct link to Instance methods")

* `append(value: T['TValue'] | TNull): this` — Appends one value; equivalent to `set(length, value)` and returns the builder.
* `set(index: number, value: T['TValue'] | TNull): this` — Writes a value (or null sentinel) at `index`.
* `setValue(index: number, value: T['TValue']): void` — Writes a raw value at `index` without null-equivalence conversion.
* `isValid(value: T['TValue'] | TNull): boolean` — Returns whether the value is not a configured null sentinel.
* `setValid(index: number, valid: boolean): boolean` — Sets the validity bit at `index`; returns previous null-state.
* `getChildAt<R extends DataType = any>(index: number): Builder<R> | null` — Returns a child builder by child index, or `null` if absent.
* `addChild(child: Builder, name?: string): void` — Attaches a nested child builder; optional name is used for keyed types.
* `flush(): Data<T>` — Materializes queued rows into one `Data<T>` chunk and resets pending state.
* `finish(): this` — Finalizes pending dictionary/index state and returns the builder.
* `clear(): this` — Empties buffered values and resets length to zero.
* `toVector(): Vector<T>` — Flushes and returns a `Vector<T>` for the current data.
* `reset` is not public; create a new builder to reinitialize

### Builder properties[​](#builder-properties "Direct link to Builder properties")

* `type: T` — The `DataType` that defines valid value encoding for this builder.
* `length: number` — Count of values currently queued for flush.
* `ArrayType` — Runtime JS typed array constructor for this builder's values.
* `finished: boolean` — `true` after builder finalization via `finish()`.
* `stride: number` — Number of physical values required for one logical value.
* `children: Builder[]` — Nested builders for complex types (`Struct`, `List`, `Map`, `Union`).
* `nullValues?: TNull[] | ReadonlyArray<TNull> | null` — Sentinel list treated as null values.
* `nullCount: number` — Number of null values in buffered input.
* `numChildren: number` — Number of nested child builders.
* `byteLength: number` — Total bytes currently used by materialized buffered values.
* `reservedLength: number` — Current value-slot capacity before growth.
* `reservedByteLength: number` — Reserved bytes for value buffers.
* `valueOffsets: T['TOffsetArray'] | null` — Offset buffer for variable-width values.
* `values: T['TArray'] | null` — Backing value buffer.
* `nullBitmap: Uint8Array | null` — Packed validity bitmap for queued values.

### Concrete builder classes[​](#concrete-builder-classes "Direct link to Concrete builder classes")

* `BoolBuilder`, `NullBuilder`, `DateBuilder`, `DateDayBuilder`, `DateMillisecondBuilder`
* `DecimalBuilder`
* `DictionaryBuilder`
* `FixedSizeBinaryBuilder`, `FixedSizeListBuilder`
* `FloatBuilder`, `Float16Builder`, `Float32Builder`, `Float64Builder`
* `IntBuilder`, `Int8Builder`, `Int16Builder`, `Int32Builder`, `Int64Builder`, `Uint8Builder`, `Uint16Builder`, `Uint32Builder`, `Uint64Builder`
* `TimeBuilder`, `TimeSecondBuilder`, `TimeMillisecondBuilder`, `TimeMicrosecondBuilder`, `TimeNanosecondBuilder`
* `TimestampBuilder`, `TimestampSecondBuilder`, `TimestampMillisecondBuilder`, `TimestampMicrosecondBuilder`, `TimestampNanosecondBuilder`
* `IntervalBuilder`, `IntervalDayTimeBuilder`, `IntervalYearMonthBuilder`
* `DurationBuilder`, `DurationSecondBuilder`, `DurationMillisecondBuilder`, `DurationMicrosecondBuilder`, `DurationNanosecondBuilder`
* `Utf8Builder`, `LargeUtf8Builder`
* `BinaryBuilder`, `LargeBinaryBuilder`
* `ListBuilder`, `MapBuilder`
* `StructBuilder`
* `UnionBuilder`, `SparseUnionBuilder`, `DenseUnionBuilder`

For factory helpers used by builders, see `makeBuilder`, `builderThroughIterable`, and `builderThroughAsyncIterable` in the Arrow exports.
