# Chunked

Holds a "chunked array" that allows a number of array fragments (represented by `Vector` instnces) to be treated logically as a single vector. `Array` instances can be concatenated into a `Chunked` without any memory beind copied.

A `Chunked` array supports iteration, random access element access and mutation.

extends Vector

## Static Methods

### Chunked.flatten(...vectors: Vector[]) : any[]

Flattens a number of `Vector` instances into a single JavaScript array, by allocating and copying memory from each `Vector`.

TBD:
- Is the result a typed array or JS array?
- Do the 

### Chunked.concat(...chunks: Vector<T>[]): Chunked

<p class="badges">
   <img src="https://img.shields.io/badge/zero-copy-green.svg?style=flat-square" alt="zero-copy" />
</p>

Concatenates a number of `Vector` instances into a `Chunked` array.

## Members

### [Symbol.iterator](): IterableIterator

`Chunked` arrays are iterable. You can use constructs like `for (const element of vector)` to iterate over elements.

### type  (read-only)

Returns the type of elements in this `Chunked` instance. All vector chunks will have this type.

### length: Number  (read-only)

Returns the total number of elements in this `Chunked` instance. This 

### chunks: Vector[]  (read-only)

Returns an array of the `Vector` chunks that hold the elements in this `Chunked` array.

### typeId: T['TType']  (read-only)

### data: Data  (read-only)

### ArrayType  (read-only)

### numChildren  (read-only)

### stride  (read-only)

### nullCount  (read-only)

### indices: ChunkedKeys<T> | null  (read-only)

TBD

### dictionary: ChunkedDict | null  (read-only)

If this is a dictionary encoded column, returns the Dictionary.


## Methods

### constructor(type: T, chunks?: Vector[] = [], offsets?)

<p class="badges">
   <img src="https://img.shields.io/badge/zero-copy-green.svg?style=flat-square" alt="zero-copy" />
</p>

Creates a new `Chunked` array instance of the given `type` and optionally initializes it with a list of `Vector` instances.

* `type` - 
* `chunks`= - Vectors must all be compatible with `type`.
* `offsets`= - If not provided, offsets are autocalculated from the chunks.

TBD
- Provide some information on how `offsets` can be used?


### clone(chunks? : this.chunks): Chunked

<p class="badges">
   <img src="https://img.shields.io/badge/zero-copy-green.svg?style=flat-square" alt="zero-copy" />
</p>

Returns a new `Chunked` instance that is a clone of this instance.


### concat(...others: Vector<T>[]): Chunked

<p class="badges">
   <img src="https://img.shields.io/badge/zero-copy-green.svg?style=flat-square" alt="zero-copy" />
</p>

Concatenates a number of `Vector` instances into a `Chunked` array.


### slice(begin?: number, end?: number): Chunked

Returns a new chunked array representing the logical array containing the elements within the index range., potentially dropping some chunks at beginning and end.

* `begin`=`0` - The first logical index to be included as index 0 in the new array.
* `end` - The first logical index to be included as index 0 in the new array. Defaults to the last element in the range.

TBD
- Does this support negative indices etc like native slice?


### getChildAt(index: Number): Chunked | null

TBD
- Returns the chunk holding the element at `index`.

### search(index: number): [number, number] | null;
### search(index: number, then?: SearchContinuation): ReturnType<N>;
### search(index: number, then?: SearchContinuation)


### isValid(index: number): boolean

Checks if the element at `index` in the logical array is valid.

### get(index: number): Type | null

Returns the element at `index` in the logical array, or `null` if no such element exists (e.e.g if `index` is out of range).

### set(index: number, value: Type | null): void

Returns the element at `index` in the logical array, or `null` if no such element exists (e.e.g if `index` is out of range).

### indexOf(element: Type, offset?: number): number

Returns the index of the first element with value `element`

* `offset` - the index to start searching from.

### toArray(): Type[]

Returns a JavaScript Array by flattening the chunks
