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


### Static FloatVector Methods

### FloatVector.from(data: Uint16Array): Float16Vector;
### FloatVector.from(data: Float32Array): Float32Vector;
### FloatVector.from(data: Float64Array): Float64Vector;
### FloatVector16.from(data: Uint8Array | `Iterable<Number>`): Float16Vector;
### FloatVector16.from(data: Uint16Array | `Iterable<Number>`): Float16Vector;
### FloatVector32.from(data: Float32['TArray'] | `Iterable<Number>`): Float32Vector;
### FloatVector64.from(data: Float64['TArray'] | `Iterable<Number>`): Float64Vector;


## Float16Vector Methods

Since JS doesn't have half floats, `Float16Vector` is backed by a `Uint16Array` integer array. To make it practical to work with these arrays in JS, some extra methods are added.

### toArray() : `Uint16Array`

Returns a zero-copy view of the underlying `Uint16Array` data.

Note: Avoids incurring extra compute or copies if you're calling `toArray()` in order to create a buffer for something like WebGL, but makes it hard to use the returned data as floating point values in JS.

### toFloat32Array() : Float32Array

This method will convert values to 32 bit floats. Allocates a new Array.

### toFloat64Array() : Float64Array

This method will convert values to 64 bit floats. Allocates a new Array.


## IntVectors

| Int Vectors             | Backing         | Comments                  |
| ---                     | ---             | ---                       |
| `Int8Vector`            | `Int8Array`     |                           |
| `Int16Vector`           | `Int16Array`    |                           |
| `Int32Vector`           | `Int32Array`    |                           |
| `Int64Vector`           | `Int32Array`    | 64-bit values stored as pairs of `lo, hi` 32-bit values for engines without BigInt support, extra methods available |
| `Uint8Vector`           | `Uint8Array`    |                           |
| `Uint16Vector`          | `Uint16Array `  |                           |
| `Uint32Vector`          | `Uint32Array `  |                           |
| `Uint64Vector`          | `Uint32Array`   | 64-bit values stored as pairs of `lo, hi` 32-bit values for engines without BigInt support, extra methods available |

## Int64Vector Methods

### toArray() : `Int32Array`

Returns a zero-copy view of the underlying pairs of `lo, hi` 32-bit values as an `Int32Array`. This Array's length is twice the logical length of the `Int64Vector`.

### toBigInt64Array(): `BigInt64Array`

Returns a zero-copy view of the underlying 64-bit integers as a `BigInt64Array`. This Array has the samne length as the length of the original `Int64Vector`.

Note: as of 03/2019, `BigInt64Array` is only available in v8/Chrome. In JS runtimes without support for `BigInt`, this method throws an unsupported error.

## Uint64Vector Methods

### toArray() : `Uint32Array`

Returns a zero-copy view of the underlying pairs of `lo, hi` 32-bit values as a `Uint32Array`. This Array's length is twice the logical length of the `Uint64Vector`.

### toBigUint64Array(): `BigUint64Array`

Returns a zero-copy view of the underlying 64-bit integers as a `BigUint64Array`. This Array has the samne length as the length of the original `Uint64Vector`.

Note: as of 03/2019, `BigUint64Array` is only available in v8/Chrome. In JS runtimes without support for `BigInt`, this method throws an unsupported error.

## Static IntVector Methods

### IntVector.from(data: Int8Array): Int8Vector;
### IntVector.from(data: Int16Array): Int16Vector;
### IntVector.from(data: Int32Array, is64?: boolean): Int32Vector | Int64Vector;
### IntVector.from(data: Uint8Array): Uint8Vector;
### IntVector.from(data: Uint16Array): Uint16Vector;
### IntVector.from(data: Uint32Array, is64?: boolean): Uint32Vector | Uint64Vector;

### Int8Vector.from(this: typeof Int8Vector,   data: Int8Array   | `Iterable<number>`): Int8Vector;
### Int16Vector.from(this: typeof Int16Vector,  data: Int16Array  | `Iterable<number>`): Int16Vector;
### Int32Vector.from(this: typeof Int32Vector,  data: Int32Array  | `Iterable<number>`): Int32Vector;
### Int64Vector.from(this: typeof Int64Vector,  data: Int32Array  | `Iterable<number>`): Int64Vector;
### Uint8Vector.from(this: typeof Uint8Vector,  data: Uint8Array  | `Iterable<number>`): Uint8Vector;
### Uint16Vector.from(this: typeof Uint16Vector, data: Uint16Array | `Iterable<number>`): Uint16Vector;
### Uint32Vector.from(this: typeof Uint32Vector, data: Uint32Array | `Iterable<number>`): Uint32Vector;
### Uint64Vector.from(this: typeof Uint64Vector, data: Uint32Array | `Iterable<number>`): Uint64Vector;


## Date Vectors

| Date Vectors            | Backing       |                     |
| ---                     | ---           | ---                 |
| `DateDayVector`         | `Int32Array`  |                     |
| `DateMillisecondVector` | `Int32Array`  | TBD - stride: 2?    |
