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

## Usage

```js
import {GL, GLType} from '@loaders.gl/math';
// Returns Int8Array.BYTES_PER_ELEMENT
var size = GLType.getSizeInBytes(GL.BYTE);
```

## Static Methods

### GLType.fromTypedArray(typedArray: Typed Array | Function) : Number

Returns the size, in bytes, of the corresponding datatype.

- `glType` The component datatype to get the size of.

Returns

The size in bytes.

Throws
- glType is not a valid value.


Gets the {@link ComponentDatatype} for the provided TypedArray instance.

-  array The typed array.

Returns

The ComponentDatatype for the provided array, or undefined if the array is not a TypedArray.

### GLType.getArrayType(glType: Number) : Function

returns the constructor of the array

### static GLType.getByteSize(glType: Number) : Number

Returns the size in bytes of one element of the provided WebGL type.

Equivalent to `GLType.getArrayType(glType).BYTES_PER_ELEMENT`.

### static GLType.validate(glType) : Boolean

Returns `true` if `glType` is a valid WebGL data type.

### static GLType.createTypedArray(glType : Number, buffer : ArrayBuffer [, byteOffset : Number [, length : Number]]) : TypedArray

Creates a typed view of an array of bytes.

- `glType` The type of typed array (ArrayBuffer view) to create.
- `buffer` The buffer storage to use for the view.
- `byteOffset`=`0` The offset, in bytes, to the first element in the view.
- `length`= The number of elements in the view. Defaults to buffer length.

Returns

`Int8Array`|`Uint8Array`|`Int16Array`|`Uint16Array`|`Int32Array`|`Uint32Array`|`Float32Array`|`Float64Array` A typed array view of the buffer.

Throws
- `glType` is not a valid value.
