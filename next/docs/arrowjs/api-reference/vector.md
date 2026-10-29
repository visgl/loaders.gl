Arrow JS API · column view

# A Vector is a column you can work with.

Vector presents one logical Arrow column over one or more Data chunks. Use it for indexed access, iteration, slicing, child columns, and typed values without flattening the underlying storage first.

[Data](https://loaders.gl/next/docs/arrowjs/api-reference/data.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs/api-reference/data.md)[Table](https://loaders.gl/next/docs/arrowjs/api-reference/table.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs/api-reference/table.md)[Vector helpers](https://loaders.gl/next/docs/arrowjs/api-reference/vectors.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/arrowjs/api-reference/vectors.md)

The Vector model

## Read one column without losing its storage model.

A Vector is logical rather than necessarily contiguous. Arrow JS can keep multiple chunks behind one column interface, which lets streaming and IPC data remain efficient while applications use familiar accessors.

01

Logical type

One DataType for the vector

02

Storage

One or more Data chunks

03

Access

get, iteration, slicing, and validity checks

04

Nested data

Child vectors for lists, structs, maps, and unions

Detailed guide

## Vector reference

The sections below document construction, fields, indexed access, iteration, slicing, child vectors, and validity behavior.

info

This page is aligned to Apache Arrow JS v21.x (`apache-arrow`).

An array-like Arrow data container. Use [`makeVector`](https://loaders.gl/next/docs/arrowjs/api-reference/vectors.md) and [`vectorFromArray`](https://loaders.gl/next/docs/arrowjs/api-reference/vectors.md) to construct vectors.

## Usage[​](#usage "Direct link to Usage")

```
import {makeVector} from 'apache-arrow';



const values = makeVector(new Int32Array([1, 2, 3]));

console.log(values.length, values.get(1));
```

```
import {vectorFromArray, Struct, Field, Int32, Utf8} from 'apache-arrow';



const rows = vectorFromArray(

  [

    {id: 1, tag: 'a'},

    {id: 2, tag: 'b'}

  ],

  new Struct([new Field('id', new Int32()), new Field('tag', new Utf8())])

);

console.log(rows.get(0)?.tag, rows.toArray());
```

## Constructors[​](#constructors "Direct link to Constructors")

`new Vector<T extends DataType = any>(input: readonly (Data<T> | Vector<T>)[])`

Create a vector from one or more `Data<T>` segments. Multiple chunks are treated as a single logical vector.

## Fields[​](#fields "Direct link to Fields")

* `readonly type: T`
  * Logical `DataType` for all entries.
* `readonly data: ReadonlyArray<Data<T>>`
  * Backing `Data` chunks that power random access and iteration.
* `readonly length: number`
  * Number of logical elements across all chunks.
* `readonly stride: number`
  * Physical values consumed per logical element for the underlying type.
* `readonly numChildren: number`
  * Count of nested child vectors for nested data types.
* `byteLength: number`
  * Aggregate size of value buffers and child vectors in bytes.
* `nullable: boolean`
  * Whether any element can be null.
* `nullCount: number`
  * Number of null rows in the vector.
* `readonly ArrayType: T['ArrayType']`
  * Typed array constructor for non-null value storage.
* `readonly VectorName: string`
  * Display label used in diagnostics.
* `readonly [Symbol.toStringTag]: string`
  * Class name exposed by `Object.prototype.toString`.

## Methods[​](#methods "Direct link to Methods")

### `isValid(index: number): boolean`[​](#isvalidindex-number-boolean "Direct link to isvalidindex-number-boolean")

Returns whether the value at `index` is not null.

### `get(index: number): T['TValue'] | null`[​](#getindex-number-ttvalue--null "Direct link to getindex-number-ttvalue--null")

Returns the value at `index`.

### `at(index: number): T['TValue'] | null`[​](#atindex-number-ttvalue--null "Direct link to atindex-number-ttvalue--null")

Returns the value at `index`, supporting negative offsets from the end.

### `set(index: number, value: T['TValue'] | null): void`[​](#setindex-number-value-ttvalue--null-void "Direct link to setindex-number-value-ttvalue--null-void")

Overwrites a position in the current chunk.

### `indexOf(element: T['TValue'], offset?: number): number`[​](#indexofelement-ttvalue-offset-number-number "Direct link to indexofelement-ttvalue-offset-number-number")

Finds the first row index with a matching value.

### `includes(element: T['TValue'], offset?: number): boolean`[​](#includeselement-ttvalue-offset-number-boolean "Direct link to includeselement-ttvalue-offset-number-boolean")

Returns whether `element` exists from `offset` onward.

### `[Symbol.iterator](): IterableIterator<T['TValue'] | null>`[​](#symboliterator-iterableiteratorttvalue--null "Direct link to symboliterator-iterableiteratorttvalue--null")

Iterates the vector values in order.

### `concat(...others: Vector<T>[]): Vector<T>`[​](#concatothers-vectort-vectort "Direct link to concatothers-vectort-vectort")

Creates a concatenated vector from vectors of the same logical type.

### `slice(begin?: number, end?: number): Vector<T>`[​](#slicebegin-number-end-number-vectort "Direct link to slicebegin-number-end-number-vectort")

Returns a zero-copy logical slice over `[begin, end)`.

### `toArray(): T['TArray']`[​](#toarray-ttarray "Direct link to toarray-ttarray")

Materializes the logical values as a JS array or typed array.

### `toJSON(): (T['TValue'] | null)[]`[​](#tojson-ttvalue--null "Direct link to tojson-ttvalue--null")

Converts values to a JSON-friendly array.

### `toString(): string`[​](#tostring-string "Direct link to tostring-string")

Returns a human-readable value summary.

### `getChild<R extends keyof T['TChildren']>(name: R): Vector<T['TChildren'][R]> | null`[​](#getchildr-extends-keyof-ttchildrenname-r-vectorttchildrenr--null "Direct link to getchildr-extends-keyof-ttchildrenname-r-vectorttchildrenr--null")

Returns a nested child by name.

### `getChildAt<R extends DataType = any>(index: number): Vector<R> | null`[​](#getchildatr-extends-datatype--anyindex-number-vectorr--null "Direct link to getchildatr-extends-datatype--anyindex-number-vectorr--null")

Returns a nested child by positional index.

### `isMemoized(): boolean`[​](#ismemoized-boolean "Direct link to ismemoized-boolean")

Whether decoded values are memoized for repeated reads.

### `memoize(): MemoizedVector<T>`[​](#memoize-memoizedvectort "Direct link to memoize-memoizedvectort")

Returns a memoized view that caches expensive decoding paths.

### `unmemoize(): Vector<T>`[​](#unmemoize-vectort "Direct link to unmemoize-vectort")

Returns a non-memoized equivalent view.
