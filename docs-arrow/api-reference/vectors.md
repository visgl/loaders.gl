# Types and Vectors

## Overview


## Usage

Constructing new `Vector` instances is done through the static `from()` methods


## Special Vectors

### Dictionary Arrays

The Dictionary type is a special array type that enables one or more record batches in a file or stream to transmit integer indices referencing a shared dictionary containing the distinct values in the logical array. Later record batches reuse indices in earlier batches and add new ones as needed.

A `Dictionary` is similar to a `factor` in R or a pandas, or "Categorical" in Python. It is is often used with strings to save memory and improve performance.


### StructVector

Holds nested fields.


### Bool Vectors

| Bool Vectors            |
| ---                     |
| `BoolVector`            |


### Binary Vectors

| Binary Vectors          |
| ---                     |
| `BinaryVector`          |


## FloatVectors

| Float Vectors           | Backing         | Comments                  |
| ---                     |
| `Float16Vector`         | `Uint16Array`   | No native JS 16 bit type, additional methods available |
| `Float32Vector`         | `Float32Array`  | Holds 32 bit floats       |
| `Float64Vector`         | `Float64Array`  | Holds 64 bit floats       |


### FloatVector Methods

### FloatVector.from(data: Uint16Array): Float16Vector;
### FloatVector.from(data: Float32Array): Float32Vector;
### FloatVector.from(data: Float64Array): Float64Vector;
### FloatVector16.from(data: Uint8Array | Iterable<Number>): Float16Vector;
### FloatVector16.from(data: Uint16Array | Iterable<Number>): Float16Vector;
### FloatVector32.from(data: Float32['TArray'] | Iterable<Number>): Float32Vector;
### FloatVector64.from(data: Float64['TArray'] | Iterable<Number>): Float64Vector;


## Float16Vector Methods

Since JS doesn't have half floats, `Float16Vector` is backed by a `Uint16Array` integer array.

### toArray() : `Uint16Array`

Returns a zero-copy slice of the underlying `Uint16Array` data. This avoids incurring extra compute or copies if you're calling `toArray()` in order to create a buffer for something like WebGL, but makes it hard to use the returned data as floating point values in JS.

### toFloat32Array() : Float32Array

This method will convert values to 32 bit floats. Allocates a new Array.

### toFloat64Array() : Float64Array

This method will convert values to 64 bit floats. Allocates a new Array.


## IntVectors

| Int Vectors             | Backing            |
| ---                     | ---                |
| `Int8Vector`            | `Int8Array`        |
| `Int16Vector`           | `Int16Array`       |
| `Int32Vector`           | `Int32Array`       |
| `Int64Vector`           | `BigInt64Array`    |
| `Uint8Vector`           | `Uint8Array`       |
| `Uint16Vector`          | `Uint16Array `     |
| `Uint32Vector`          | `Uint32Array `     |
| `Uint64Vector`          | `BigUint64Array`   |


### IntVector.from(data: Int8Array): Int8Vector;
### IntVector.from(data: Int16Array): Int16Vector;
### IntVector.from(data: Int32Array, is64?): Int32Vector | Int64Vector;
### IntVector.from(data: Uint8Array): Uint8Vector;
### IntVector.from(data: Uint16Array): Uint16Vector;
### IntVector.from(data: Uint32Array, is64?): Uint32Vector | Uint64Vector;

### Int8Vector.from(this: typeof Int8Vector,   data: Int8Array   | Iterable<number>): Int8Vector;
### Int16Vector.from(this: typeof Int16Vector,  data: Int16Array  | Iterable<number>): Int16Vector;
### Int32Vector.from(this: typeof Int32Vector,  data: Int32Array  | Iterable<number>): Int32Vector;
### Int64Vector.from(this: typeof Int64Vector,  data: Int32Array  | Iterable<number>): Int64Vector;
### Uint8Vector.from(this: typeof Uint8Vector,  data: Uint8Array  | Iterable<number>): Uint8Vector;
### Uint16Vector.from(this: typeof Uint16Vector, data: Uint16Array | Iterable<number>): Uint16Vector;
### Uint32Vector.from(this: typeof Uint32Vector, data: Uint32Array | Iterable<number>): Uint32Vector;
### Uint64Vector.from(this: typeof Uint64Vector, data: Uint32Array | Iterable<number>): Uint64Vector;


## Date Vectors

| Date Vectors            |
| ---                     |
| `DateDayVector`         |
| `DateMillisecondVector` |


