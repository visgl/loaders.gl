# Chunked

Holds a "chunked array" that allows a number of array fragments (represented by `Vector` instnces) to be treated logically as a single vector. `Array` instances can be concatenated into a `Chunked` without any memory beind copied.


## Usage

Create a new contiguous typed array from a `Chunked` instance (note that this creates a new typed array unless only one chunk)
```js
const typedArray = column.toArray();
```

A `Chunked` array supports iteration, random access element access and mutation.



## Inheritance

class Chunked extends [Vector](docs-arrow/api-reference/vector.md)


## Static Methods

### Chunked.flatten(...vectors: Vector[]) : Vector

Flattens a number of `Vector` instances into a single `Vector` instance, by allocating and copying memory from each `Vector`.

TBD - does this return a new `Vector` or a `Chunked`?



### Chunked.concat(...chunks: Vector<T>[]): Chunked

<p class="badges">
   <img src="https://img.shields.io/badge/zero-copy-green.svg?style=flat-square" alt="zero-copy" />
</p>

Concatenates a number of `Vector` instances after the chunks. Returns a new `Chunked` array.

TBD - the supplied `Vector` chunks need to be of same type as the current chunks.


## Members

### [Symbol.iterator]() : Iterator

`Chunked` arrays are iterable, allowing you to use constructs like `for (const element of vector)` to iterate over elements.

### type : TBD (read-only)

Returns the type of elements in this `Chunked` instance. All vector chunks will have this type.

### length: Number  (read-only)

Returns the total number of elements in this `Chunked` instance, representing the length of of all chunks.

### chunks: Vector[]  (read-only)

Returns an array of the `Vector` chunks that hold the elements in this `Chunked` array.

### typeId : TBD  (read-only)

### data : Data  (read-only)

### ArrayType  (read-only)

Returns the type of the array that is used to represent the chunks.

### numChildren  (read-only)


### stride  (read-only)

This affects the

### nullCount  (read-only)

Number of null values across all Vector chunks in this chunked array.

### indices : ChunkedKeys<T> | null  (read-only)

TBD

### dictionary: ChunkedDict | null  (read-only)

If this is a dictionary encoded column, returns the Dictionary.


## Methods

### constructor(type : \*, chunks? : Vector[] = [], offsets? : Number[])

<p class="badges">
   <img src="https://img.shields.io/badge/zero-copy-green.svg?style=flat-square" alt="zero-copy" />
</p>

Creates a new `Chunked` array instance of the given `type` and optionally initializes it with a list of `Vector` instances.

* `type` - TBD
* `chunks`= - Vectors must all be compatible with `type`.
* `offsets`= - Offset into each chunk, elements before this offset are ignore in the contanated array. If not provided, offsets are autocalculated from the chunks.

TBD - Confirm/provide some information on how `offsets` can be used?


### clone(chunks? : this.chunks): Chunked

<p class="badges">
   <img src="https://img.shields.io/badge/zero-copy-green.svg?style=flat-square" alt="zero-copy" />
</p>

Returns a new `Chunked` instance that is a clone of this instance. Does not copy the actual chunks, so the new `Chunked` instance will reference the same chunks.


### concat(...others: Vector<T>[]): Chunked

<p class="badges">
   <img src="https://img.shields.io/badge/zero-copy-green.svg?style=flat-square" alt="zero-copy" />
</p>

Concatenates a number of `Vector` instances after the chunks. Returns a new `Chunked` array.

TBD - the supplied `Vector` chunks need to be of same type as the current chunks.


### slice(begin?: Number, end?: Number): Chunked

Returns a new chunked array representing the logical array containing the elements within the index range., potentially dropping some chunks at beginning and end.

* `begin`=`0` - The first logical index to be included as index 0 in the new array.
* `end` - The first logical index to be included as index 0 in the new array. Defaults to the last element in the range.

TBD
- Does this support negative indices etc like native slice?


### getChildAt(index : Number): Chunked | null

- Returns the chunk holding the element at `index`.

TBD - confirm

### search(index: Number): [number, number] | null;
### search(index: Number, then?: SearchContinuation): ReturnType<N>;
### search(index: Number, then?: SearchContinuation)

TBD?

### isValid(index: Number): boolean

Checks if the element at `index` in the logical array is valid.

Checks the null map (if present) to determine if the value in the logical `index` is included.

### get(index : Number): Type | null

Returns the element at `index` in the logical array, or `null` if no such element exists (e.e.g if `index` is out of range).

### set(index: Number, value: Type | null): void

Returns the element at `index` in the logical array, or `null` if no such element exists (e.e.g if `index` is out of range).

### indexOf(element: Type, offset?: Number): Number

Returns the index of the first element with value `element`

* `offset` - the index to start searching from.

### toArray(): TypedArray

Returns a single contiguous typed array containing data in all the chunks (effectively "flattening" the chunks.

Notes:
* Calling this function creates a new typed array unless there is only one chunk.


