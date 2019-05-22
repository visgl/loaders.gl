# GLType

Helper functions to work with WebGL data type constants.

| WebGL type constant | JavaScript Typed Array | Notes                                 |
| ------------------- | ---------------------- | ------------------------------------- |
| `GL.FLOAT`          | `Float32Array`         |                                       |
| `GL.DOUBLE`         | `Float64Array`         | Not yet directly usable in WebGL/GLSL |
| `GL.UNSIGNED_SHORT` | `Uint16Array`          |                                       |
| `GL.UNSIGNED_INT`   | `Uint32Array`          |                                       |
| `GL.UNSIGNED_BYTE`  | `Uint8Array`           |                                       |
| `GL.UNSIGNED_BYTE`  | `Uint8ClampedArray`    |                                       |
| `GL.BYTE`           | `Int8Array`            |                                       |
| `GL.SHORT`          | `Int16Array`           |                                       |
| `GL.INT`            | `Int32Array`           |                                       |

## Static Methods

### GLType.fromTypedArray(typedArray: Typed Array | Function) : Number

Returns the size, in bytes, of the corresponding datatype.

@param {ComponentDatatype} glType The component datatype to get the size of.
@returns {Number} The size in bytes.

@exception {DeveloperError} glType is not a valid value.

@example
// Returns Int8Array.BYTES_PER_ELEMENT
var size = Cesium.ComponentDatatype.getSizeInBytes(Cesium.ComponentDatatype.BYTE);

Gets the {@link ComponentDatatype} for the provided TypedArray instance.

@param {TypedArray} array The typed array.
@returns {ComponentDatatype} The ComponentDatatype for the provided array, or undefined if the array is not a TypedArray.

### GLType.getArrayType(glType: Number) : Function

returns the constructor of the array

### static GLType.getByteSize(glType: Number) : Number

Returns the size in bytes of one element of the provided WebGL type.

Equivalent to `GLType.getArrayType(glType).BYTES_PER_ELEMENT`.

### static GLType.validate(glType) : Boolean

Returns `true` if `glType` is a valid WebGL data type.

### static GLType.createTypedArray(glType, buffer [, byteOffset = 0 [, length]]) : TypedArray

Creates a typed view of an array of bytes.

- `glType` (`Number`) - The type of typed array (ArrayBuffer view) to create.
- `buffer` (`ArrayBuffer`) - The buffer storage to use for the view.
- `byteOffset`=`0` (`Number`) - The offset, in bytes, to the first element in the view.
- `length`= (`Number`) - The number of elements in the view.

Returns {Int8Array|Uint8Array|Int16Array|Uint16Array|Int32Array|Uint32Array|Float32Array|Float64Array} A typed array view of the buffer.

Throws: `glType` is not a valid value.
