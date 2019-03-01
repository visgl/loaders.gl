# BaseVector


## Fields

### data: Data<T> (readonly)

### numChildren: number (readonly)

### type : ?

### typeId : ?

### length : ?

### offset : ?

### stride : ?

### nullCount : ?

### VectorName : ?

### ArrayType : ?

### values : ?

### typeIds : ?

### nullBitmap : ?

### valueOffsets : ?


## Methods

### clone(data: Data<R>, children)

### concat(...others: Vector<T>[])

### slice(begin?: number, end?: number)

// Adjust args similar to Array.prototype.slice. Normalize begin/end to
// clamp between 0 and length, and wrap around on negative indices, e.g.
// slice(-1, 5) or slice(5, -1)

### isValid(index: number): boolean

### getChildAt<R extends DataType = any>(index: number): Vector<R> | null

### toJSON(): any
