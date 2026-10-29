Arrow JS API · vector construction

# Create a typed column from the data you already have.

Use makeVector for typed-array or Data-backed input, and vectorFromArray when values begin as ordinary JavaScript data. Both produce the modern Vector abstraction used by tables and record batches.

[Vector](https://loaders.gl/next/docs/arrowjs/api-reference/vector.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs/api-reference/vector.md)[Builder](https://loaders.gl/next/docs/arrowjs/api-reference/builder.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs/api-reference/builder.md)[Data types](https://loaders.gl/next/docs/arrowjs/api-reference/types.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs/api-reference/types.md)

The vector factory path

## Choose inference or control.

Use typed arrays when the storage and type are already known. Use vectorFromArray when readability and type inference matter, or pass an explicit DataType for nested and precise schemas.

01

makeVector

Typed arrays, Data chunks, or existing vectors

02

vectorFromArray

Plain values with optional type inference

03

Zero-copy

Typed-array input can retain its backing storage

04

Nested data

Struct and other child types through explicit schemas

Detailed guide

## Vector factories and type support

The sections below document factory signatures, inference behavior, supported type families, and examples for scalar and structured vectors.

info

This page is aligned to Apache Arrow JS v21.x (`apache-arrow`).

Vector construction is centered on the `Vector` class; Arrow no longer publishes long-lived public classes such as `Int32Vector`.

## Usage[​](#usage "Direct link to Usage")

```
import {makeVector} from 'apache-arrow';



const ids = makeVector(new Int32Array([1, 2, 3]));

console.log(ids.length, ids.get(0));
```

```
import {vectorFromArray, Struct, Field, Int32, Utf8} from 'apache-arrow';



const rows = vectorFromArray(

  [{id: 1, label: 'alpha'}],

  new Struct([new Field('id', new Int32()), new Field('label', new Utf8())])

);
```

## Factory functions[​](#factory-functions "Direct link to Factory functions")

* `makeVector<T extends TypedArray | BigIntArray>(data: T | readonly T[]): Vector`
* `makeVector<T extends DataView>(data: T | readonly T[]): Vector`
* `makeVector<T extends DataType>(data: Data<T> | readonly Data<T>[] | Vector<T> | readonly Vector<T>[] | DataProps<T> | readonly DataProps<T>[]): Vector<T>`
* `vectorFromArray(values: readonly unknown[], type?: DataType): Vector`
* `vectorFromArray<T extends readonly unknown[]>(values: T): Vector`

## Factory function behavior[​](#factory-function-behavior "Direct link to Factory function behavior")

* `makeVector` prefers typed-array input and zero-copy semantics when possible.
* `vectorFromArray` infers Arrow types from plain JS input and accepts optional explicit type overrides.

```
import {makeVector, vectorFromArray, Struct, Field, Int32, Utf8} from 'apache-arrow';



const a = makeVector(new Int32Array([1, 2, 3]));

const b = vectorFromArray(['a', 'b', 'c']);

const rows = vectorFromArray(

  [

    {id: 1, name: 'Alice'},

    {id: 2, name: 'Bob'}

  ],

  new Struct([new Field('id', new Int32()), new Field('name', new Utf8())])

);
```

## Supported type families[​](#supported-type-families "Direct link to Supported type families")

`Vector` is shared across all Arrow logical type families:

* Null and boolean
* Integer and floating point
* Binary and text (`Binary`, `Utf8`, `LargeBinary`, `LargeUtf8`)
* Fixed-size list, list, struct, and map
* Temporal (`Date*`, `Time*`, `Timestamp*`)
* Interval, duration, dictionary, and union

For a full list of concrete `DataType` classes, see [`types.md`](https://loaders.gl/next/docs/arrowjs/api-reference/types.md).
