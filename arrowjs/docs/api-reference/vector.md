# Vector

Also referred to as `BaseVector`. An abstract base class for vector types.

* Can support a null map
* ...
* TBD


## Inheritance


## Fields

### data: `Data<T>` (readonly)

The underlying Data instance for this Vector.

### numChildren: number (readonly)

The number of logical Vector children. Only applicable if the DataType of the Vector is one of the nested types (List, FixedSizeList, Struct, or Map).

### type : T

The DataType that describes the elements in the Vector

### typeId : T['typeId']

The `typeId` enum value of the `type` instance

### length : number

Number of elements in the `Vector`

### offset : number

Offset to the first element in the underlying data.

### stride : number

Stride between successive elements in the the underlying data.

The number of elements in the underlying data buffer that constitute a single logical value for the given type. The stride for all DataTypes is 1 unless noted here:

- For `Decimal` types, the stride is 4.
- For `Date` types, the stride is 1 if the `unit` is DateUnit.DAY, else 2.
- For `Int`, `Interval`, or `Time` types, the stride is 1 if `bitWidth <= 32`, else 2.
- For `FixedSizeList` types, the stride is the `listSize` property of the `FixedSizeList` instance.
- For `FixedSizeBinary` types, the stride is the `byteWidth` property of the `FixedSizeBinary` instance.

### nullCount : Number

Number of `null` values in this `Vector` instance (`null` values require a null map to be present).

### VectorName : String

Returns the name of the Vector

### ArrayType : TypedArrayConstructor | ArrayConstructor

Returns the constructor of the underlying typed array for the values buffer as determined by this Vector's DataType.

### values : T['TArray']

Returns the underlying data buffer of the Vector, if applicable.

### typeIds : Int8Array | null

Returns the underlying typeIds buffer, if the Vector DataType is Union.

### nullBitmap : Uint8Array | null

Returns the underlying validity bitmap buffer, if applicable.

Note: Since the validity bitmap is a Uint8Array of bits, it is _not_ sliced when you call `vector.slice()`. Instead, the `vector.offset` property is updated on the returned Vector. Therefore, you must factor `vector.offset` into the bit position if you wish to slice or read the null positions manually. See the implementation of `BaseVector.isValid()` for an example of how this is done.

### valueOffsets : Int32Array | null

Returns the underlying valueOffsets buffer, if applicable. Only the List, Utf8, Binary, and DenseUnion DataTypes will have valueOffsets.

## Methods

### clone(data: `Data<R>`, children): `Vector<R>`

Returns a clone of the current Vector, using the supplied Data and optional children for the new clone. Does not copy any underlying buffers.

### concat(...others: `Vector<T>[]`)

Returns a `Chunked` vector that concatenates this Vector with the supplied other Vectors. Other Vectors must be the same type as this Vector.


### slice(begin?: number, end?: number)

Returns a zero-copy slice of this Vector. The begin and end arguments are handled the same way as JS' `Array.prototype.slice`; they are clamped between 0 and `vector.length` and wrap around when negative, e.g. `slice(-1, 5)` or `slice(5, -1)`

### isValid(index: number): boolean

Returns whether the supplied index is valid in the underlying validity bitmap.

### getChildAt`<R extends DataType = any>`(index: number): `Vector<R>` | null

Returns the inner Vector child if the DataType is one of the nested types (Map or Struct).

### toJSON(): any

Returns a dense JS Array of the Vector values, with null sentinels in-place.
