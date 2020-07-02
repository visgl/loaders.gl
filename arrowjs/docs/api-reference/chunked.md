# Chunked

Holds a "chunked array" that allows a number of array fragments (represented by `Vector` instances) to be treated logically as a single vector. `Vector` instances can be concatenated into a `Chunked` without any memory being copied.


## Usage

Create a new contiguous typed array from a `Chunked` instance (note that this creates a new typed array unless only one chunk)

```js
const typedArray = chunked.toArray();
```

A `Chunked` array supports iteration, random element access and mutation.



## Inheritance

class Chunked extends [Vector](docs-arrow/api-reference/vector.md)


## Static Methods

### Chunked.flatten(...vectors: Vector[]) : Vector

<p class="badges">
   <img src="https://img.shields.io/badge/zero-copy-green.svg?style=flat-square" alt="zero-copy" />
</p>

Utility method that flattens a number of `Vector` instances or Arrays of `Vector` instances into a single Array of `Vector` instances. If the incoming Vectors are instances of `Chunked`, the child chunks are extracted and flattened into the resulting Array. Does not mutate or copy data from the Vector instances.

Returns an Array of `Vector` instances.

### Chunked.concat(...chunks: `Vector<T>[]`): Chunked

<p class="badges">
   <img src="https://img.shields.io/badge/zero-copy-green.svg?style=flat-square" alt="zero-copy" />
</p>

Concatenates a number of `Vector` instances of the same type into a single `Chunked` Vector. Returns a new `Chunked` Vector.

Note: This method extracts the inner chunks of any incoming `Chunked` instances, and flattens them into the `chunks` array of the returned `Chunked` Vector.

## Members

### [Symbol.iterator]() : Iterator

`Chunked` arrays are iterable, allowing you to use constructs like `for (const element of chunked)` to iterate over elements. For in-order traversal, this is more performant than random-element access.

### type : T

Returns the DataType instance which determines the type of elements this `Chunked` instance contains. All vector chunks will have this type.

### length: Number  (read-only)

Returns the total number of elements in this `Chunked` instance, representing the length of of all chunks.

### chunks: Vector[]  (read-only)

Returns an array of the `Vector` chunks that hold the elements in this `Chunked` array.

### typeId : TBD  (read-only)

The `typeId` enum value of the `type` instance

### data : Data  (read-only)

Returns the `Data` instance of the _first_ chunk in the list of inner Vectors.

### ArrayType  (read-only)

Returns the constructor of the underlying typed array for the values buffer as determined by this Vector's DataType.

### numChildren  (read-only)

The number of logical Vector children for the Chunked Vector. Only applicable if the DataType of the Vector is one of the nested types (List, FixedSizeList, Struct, or Map).

### stride  (read-only)

The number of elements in the underlying data buffer that constitute a single logical value for the given type. The stride for all DataTypes is 1 unless noted here:

- For `Decimal` types, the stride is 4.
- For `Date` types, the stride is 1 if the `unit` is DateUnit.DAY, else 2.
- For `Int`, `Interval`, or `Time` types, the stride is 1 if `bitWidth <= 32`, else 2.
- For `FixedSizeList` types, the stride is the `listSize` property of the `FixedSizeList` instance.
- For `FixedSizeBinary` types, the stride is the `byteWidth` property of the `FixedSizeBinary` instance.

### nullCount  (read-only)

Number of null values across all Vector chunks in this chunked array.

### indices : `ChunkedKeys<T>` | null  (read-only)

If this is a dictionary encoded column, returns a `Chunked` instance of the indicies of all the inner chunks. Otherwise, returns `null`.

### dictionary: ChunkedDict | null  (read-only)

If this is a dictionary encoded column, returns the Dictionary.


## Methods

### constructor(type : \*, chunks? : Vector[] = [], offsets? : Number[])

<p class="badges">
   <img src="https://img.shields.io/badge/zero-copy-green.svg?style=flat-square" alt="zero-copy" />
</p>

Creates a new `Chunked` array instance of the given `type` and optionally initializes it with a list of `Vector` instances.

* `type` - The DataType of the inner chunks
* `chunks`= - Vectors must all be compatible with `type`.
* `offsets`= - A Uint32Array of offsets where each inner chunk starts and ends. If not provided, offsets are automatically calculated from the list of chunks.

TBD - Confirm/provide some information on how `offsets` can be used?


### clone(chunks? : this.chunks): Chunked

<p class="badges">
   <img src="https://img.shields.io/badge/zero-copy-green.svg?style=flat-square" alt="zero-copy" />
</p>

Returns a new `Chunked` instance that is a clone of this instance. Does not copy the actual chunks, so the new `Chunked` instance will reference the same chunks.


### concat(...others: `Vector<T>[]`): Chunked

<p class="badges">
   <img src="https://img.shields.io/badge/zero-copy-green.svg?style=flat-square" alt="zero-copy" />
</p>

Concatenates a number of `Vector` instances after the chunks. Returns a new `Chunked` array.

The supplied `Vector` chunks must be the same DataType as the `Chunked` instance.

### slice(begin?: Number, end?: Number): Chunked

Returns a new chunked array representing the logical array containing the elements within the index range, potentially dropping some chunks at beginning and end.

* `begin`=`0` - The first logical index to be included as index 0 in the new array.
* `end` - The first logical index to be included as index 0 in the new array. Defaults to the last element in the range.

Returns a zero-copy slice of this Vector. The begin and end arguments are handled the same way as JS' `Array.prototype.slice`; they are clamped between 0 and `vector.length` and wrap around when negative, e.g. `slice(-1, 5)` or `slice(5, -1)`


### getChildAt(index : Number): Chunked | null

If this `Chunked` Vector's DataType is one of the nested types (Map or Struct), returns a `Chunked` Vector view over all the chunks for the child Vector at `index`.

### search(index: Number): [number, number] | null;
### search(index: Number, then?: SearchContinuation): `ReturnType<N>`;
### search(index: Number, then?: SearchContinuation)

Using an `index` that is relative to the whole `Chunked` Vector, binary search through the list of inner chunks using supplied "global" `index` to find the chunk at that location. Returns the child index of the inner chunk and an element index that has been adjusted to the keyspace of the found inner chunk.

`search()` can be called with only an integer index, in which case a pair of `[chunkIndex, valueIndex]` are returned as a two-element Array:

```ts
let chunked = [
    Int32Vector.from([0, 1, 2, 3]),
    Int32Vector.from([4, 5, 6, 7, 8])
].reduce((x, y) => x.concat(y));

let [chunkIndex, valueIndex] = chunked.search(6)
assert(chunkIndex === 1)
assert(valueIndex === 3)
```

If `search()` is called with an integer index and a callback, the callback will be invoked with the `Chunked` instance as the first argument, then the `chunkIndex` and `valueIndex` as the second and third arguments:

```ts
let getChildValue = (parent, childIndex, valueIndex) =>
    chunked.chunks[childIndex].get(valueIndex);
let childValue = chunked.search(6, (chunked, childIndex, valueIndex) => )
```


### isValid(index: Number): boolean

Checks if the element at `index` in the logical array is valid.

Checks the null map (if present) to determine if the value in the logical `index` is included.

### get(index : Number): T['TValue'] | null

Returns the element at `index` in the logical array, or `null` if no such element exists (e.e.g if `index` is out of range).

### set(index: Number, value: T['TValue'] | null): void

Writes the given `value` at the provided `index`. If the value is null, the null bitmap is updated.

### indexOf(element: Type, offset?: Number): Number

Returns the index of the first occurrence of `element`, or `-1` if the value was not found.

* `offset` - the index to start searching from.

### toArray(): TypedArray

Returns a single contiguous typed array containing data in all the chunks (effectively "flattening" the chunks.

Notes:
* Calling this function creates a new typed array unless there is only one chunk.


