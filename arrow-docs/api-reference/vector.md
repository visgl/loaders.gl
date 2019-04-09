# Vector

Also referred to as `BaseVector`. An abstract base class for vector types.

* Can support a null map
* ...
* TBD


## Inheritance


## Fields

### data: Data<T> (readonly)


### numChildren: number (readonly)

TBD - Used by chunked

### type : ?

The type of elements in the vector.

### typeId : ?


### length : Number

Number of elements in the `Vector`

### offset : ?

Offset to the first element in the underlying data.

### stride : ?

Stride between successive elements in the the underlying data.

### nullCount : Number

Number of `null` values in this `Vector` instance (`null` values require a null map to be present).

### VectorName : String

Returns the name of the Vector

### ArrayType : ?

Returns the constructor of the underlying typed array.

### values : ?

### typeIds : ?

### nullBitmap : ?

### valueOffsets : ?


## Methods

### clone(data: Data<R>, children)

### concat(...others: Vector<T>[])



### slice(begin?: number, end?: number)

Adjust args similar to Array.prototype.slice. Normalize begin/end to clamp between 0 and length, and wrap around on negative indices, e.g. slice(-1, 5) or slice(5, -1)

### isValid(index: number): boolean

### getChildAt<R extends DataType = any>(index: number): Vector<R> | null



### toJSON(): any
