# Vector

:::info
This page is aligned to Apache Arrow JS v21.x (`apache-arrow`).
:::

An array-like Arrow data container. Use [`makeVector`](/docs/arrowjs/api-reference/vectors) and [`vectorFromArray`](/docs/arrowjs/api-reference/vectors) to construct vectors.

## Usage

```ts
import {makeVector} from 'apache-arrow';

const values = makeVector([1, 2, 3]);
console.log(values.length, values.get(1));
```

```ts
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

## Constructors

`new Vector<T extends DataType = any>(input: readonly (Data<T> | Vector<T>)[])`

Create a vector from one or more `Data<T>` segments. Multiple chunks are treated as a single logical vector.

## Fields

- `readonly type: T`
  - Logical `DataType` for all entries.
- `readonly data: ReadonlyArray<Data<T>>`
  - Backing `Data` chunks that power random access and iteration.
- `readonly length: number`
  - Number of logical elements across all chunks.
- `readonly stride: number`
  - Physical values consumed per logical element for the underlying type.
- `readonly numChildren: number`
  - Count of nested child vectors for nested data types.
- `byteLength: number`
  - Aggregate size of value buffers and child vectors in bytes.
- `nullable: boolean`
  - Whether any element can be null.
- `nullCount: number`
  - Number of null rows in the vector.
- `readonly ArrayType: T['ArrayType']`
  - Typed array constructor for non-null value storage.
- `readonly VectorName: string`
  - Display label used in diagnostics.
- `readonly [Symbol.toStringTag]: string`
  - Class name exposed by `Object.prototype.toString`.

## Methods

### `isValid(index: number): boolean`

Returns whether the value at `index` is not null.

### `get(index: number): T['TValue'] | null`

Returns the value at `index`.

### `at(index: number): T['TValue'] | null`

Returns the value at `index`, supporting negative offsets from the end.

### `set(index: number, value: T['TValue'] | null): void`

Overwrites a position in the current chunk.

### `indexOf(element: T['TValue'], offset?: number): number`

Finds the first row index with a matching value.

### `includes(element: T['TValue'], offset?: number): boolean`

Returns whether `element` exists from `offset` onward.

### `[Symbol.iterator](): IterableIterator<T['TValue'] | null>`

Iterates the vector values in order.

### `concat(...others: Vector<T>[]): Vector<T>`

Creates a concatenated vector from vectors of the same logical type.

### `slice(begin?: number, end?: number): Vector<T>`

Returns a zero-copy logical slice over `[begin, end)`.

### `toArray(): T['TArray']`

Materializes the logical values as a JS array or typed array.

### `toJSON(): (T['TValue'] | null)[]`

Converts values to a JSON-friendly array.

### `toString(): string`

Returns a human-readable value summary.

### `getChild<R extends keyof T['TChildren']>(name: R): Vector<T['TChildren'][R]> | null`

Returns a nested child by name.

### `getChildAt<R extends DataType = any>(index: number): Vector<R> | null`

Returns a nested child by positional index.

### `isMemoized(): boolean`

Whether decoded values are memoized for repeated reads.

### `memoize(): MemoizedVector<T>`

Returns a memoized view that caches expensive decoding paths.

### `unmemoize(): Vector<T>`

Returns a non-memoized equivalent view.
