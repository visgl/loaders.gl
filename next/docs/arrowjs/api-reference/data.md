Arrow JS API · storage

# Data is the chunk underneath a Vector.

Data holds the typed values, validity information, offsets, and child storage for one contiguous logical segment. Most applications use Vector and Table directly; this page is for custom readers, builders, and low-level inspection.

[Vector](https://loaders.gl/next/docs/arrowjs/api-reference/vector.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs/api-reference/vector.md)[Builder](https://loaders.gl/next/docs/arrowjs/api-reference/builder.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs/api-reference/builder.md)[Arrow JS reference](https://loaders.gl/next/docs/arrowjs/api-reference.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs/api-reference.md)

The Data model

## Keep physical buffers behind a logical column.

Data describes one chunk, including its type, length, offset, stride, validity, values, and nested children. Vector composes these chunks into the column interface used by tables and record batches.

01

Values

Primary typed data buffer

02

Validity

Null bitmap and null count metadata

03

Structure

Offsets, type ids, children, and dictionaries

04

Consumer

Vector and nested Arrow data types

Detailed guide

## Data storage reference

The sections below document members, buffer roles, slicing, validity, nested children, dictionaries, and low-level construction.

info

This page is aligned to Apache Arrow JS v21.x (`apache-arrow`).

Untyped storage backing for `Vector`.

Think of `Data` as a chunk: typed arrays and metadata for one contiguous segment.

## Usage[​](#usage "Direct link to Usage")

```
import {makeData, Int32} from 'apache-arrow';



const data = makeData({

  type: new Int32(),

  data: new Int32Array([1, 2, 3]),

  length: 3,

  nullCount: 0

});
```

```
import {makeData, Int32} from 'apache-arrow';



const data = makeData({type: new Int32(), length: 2, nullCount: 0, data: new Int32Array([1, 2])});

const copy = data.slice(0, 1);

console.log(copy.length, copy.getValid(0));
```

## Members[​](#members "Direct link to Members")

### `type: T`[​](#type-t "Direct link to type-t")

The logical `DataType`.

### `length: number`[​](#length-number "Direct link to length-number")

Number of logical elements.

### `offset: number`[​](#offset-number "Direct link to offset-number")

Logical offset into the underlying buffers.

### `stride: number`[​](#stride-number "Direct link to stride-number")

Elements per logical slot.

### `children: Data[]`[​](#children-data "Direct link to children-data")

Nested child data.

### `dictionary?: Vector`[​](#dictionary-vector "Direct link to dictionary-vector")

Optional dictionary backing (for `Dictionary` type only).

### `values: TBuffer[BufferType.DATA]`[​](#values-tbufferbuffertypedata "Direct link to values-tbufferbuffertypedata")

Primary values buffer.

### `typeIds: TBuffer[BufferType.TYPE]`[​](#typeids-tbufferbuffertypetype "Direct link to typeids-tbufferbuffertypetype")

Dictionary/union type id buffer.

### `nullBitmap: TBuffer[BufferType.VALIDITY]`[​](#nullbitmap-tbufferbuffertypevalidity "Direct link to nullbitmap-tbufferbuffertypevalidity")

Validity bitmask.

### `valueOffsets: TBuffer[BufferType.OFFSET]`[​](#valueoffsets-tbufferbuffertypeoffset "Direct link to valueoffsets-tbufferbuffertypeoffset")

Offset buffers for variable-width types.

### `ArrayType: T['ArrayType']`[​](#arraytype-tarraytype "Direct link to arraytype-tarraytype")

Physical JS typed array constructor.

### `typeId: T['TType']`[​](#typeid-tttype "Direct link to typeid-tttype")

Underlying type enum id.

### `buffers: Buffers<T>`[​](#buffers-bufferst "Direct link to buffers-bufferst")

Named tuple view of data buffers.

### `nullable: boolean`[​](#nullable-boolean "Direct link to nullable-boolean")

Whether the element type can represent null.

### `byteLength: number`[​](#bytelength-number "Direct link to bytelength-number")

Byte size across buffers.

### `nullCount: number`[​](#nullcount-number "Direct link to nullcount-number")

Computed number of null rows.

## Factory usage[​](#factory-usage "Direct link to Factory usage")

`Data` objects are created via `makeData()` in the `apache-arrow` exports.

## Methods[​](#methods "Direct link to Methods")

### `constructor(type: T, offset: number, length: number, nullCount?: number, buffers?: Partial<Buffers<T>> | Data<T>, children?: Data[], dictionary?: Vector)`[​](#constructortype-t-offset-number-length-number-nullcount-number-buffers-partialbufferst--datat-children-data-dictionary-vector "Direct link to constructortype-t-offset-number-length-number-nullcount-number-buffers-partialbufferst--datat-children-data-dictionary-vector")

Low-level constructor used for manual `Data` assembly and advanced integrations.

### `getValid(index: number): boolean`[​](#getvalidindex-number-boolean "Direct link to getvalidindex-number-boolean")

Returns whether element is non-null.

### `setValid(index: number, value: boolean): boolean`[​](#setvalidindex-number-value-boolean-boolean "Direct link to setvalidindex-number-value-boolean-boolean")

Set nullability state for one element.

### `clone<R extends DataType = T>(type?: R, offset?: number, length?: number, nullCount?: number, buffers?: Buffers<R>, children?: Data[]): Data<R>`[​](#cloner-extends-datatype--ttype-r-offset-number-length-number-nullcount-number-buffers-buffersr-children-data-datar "Direct link to cloner-extends-datatype--ttype-r-offset-number-length-number-nullcount-number-buffers-buffersr-children-data-datar")

Clone and optionally override metadata.

### `slice(offset: number, length: number): Data<T>`[​](#sliceoffset-number-length-number-datat "Direct link to sliceoffset-number-length-number-datat")

Create a sliced data instance.
